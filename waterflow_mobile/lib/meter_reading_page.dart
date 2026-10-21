import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class MeterReadingPage extends StatefulWidget {
  final Map<String, dynamic> customer;

  const MeterReadingPage({super.key, required this.customer});

  @override
  State<MeterReadingPage> createState() => _MeterReadingPageState();
}

class _MeterReadingPageState extends State<MeterReadingPage> {
  static const String baseUrl = 'http://10.0.2.2:8080';

  final _previousController = TextEditingController();
  final _currentController = TextEditingController();

  List<Map<String, dynamic>> _connections = [];
  int? _selectedConnectionId;
  DateTime _readingDate = DateTime.now();

  bool _loading = true;
  bool _saving = false;
  bool _loadingPrevious = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadConnections();
  }

  Future<void> _loadConnections() async {
    if (mounted) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }

    try {
      final response = await http
          .get(Uri.parse('$baseUrl/api/connections'))
          .timeout(const Duration(seconds: 15));

      if (response.statusCode != 200) {
        throw Exception('HTTP ${response.statusCode}');
      }

      final decoded = jsonDecode(response.body);
      if (decoded is! List) {
        throw Exception('Invalid connections response');
      }

      final customerId =
          '${widget.customer['id'] ?? widget.customer['customerId'] ?? ''}';

      final matches = decoded
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .where((connection) {
            final connectionCustomer = connection['customer'];
            if (connectionCustomer is! Map) return false;

            final id =
                connectionCustomer['id'] ?? connectionCustomer['customerId'];

            return '$id' == customerId &&
                '${connection['status'] ?? 'ACTIVE'}'.toUpperCase() == 'ACTIVE';
          })
          .toList();

      if (!mounted) return;

      final oldSelectedId = _selectedConnectionId;
      int? selectedId;

      if (matches.any(
        (connection) => int.tryParse('${connection['id']}') == oldSelectedId,
      )) {
        selectedId = oldSelectedId;
      } else if (matches.length == 1) {
        selectedId = int.tryParse('${matches.first['id']}');
      }

      setState(() {
        _connections = matches;
        _selectedConnectionId = selectedId;
        _previousController.clear();
      });

      if (selectedId != null) {
        await _loadPreviousReading(selectedId);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Could not load water connections. $e';
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _loadPreviousReading(int connectionId) async {
    setState(() {
      _loadingPrevious = true;
      _previousController.clear();
      _error = null;
    });

    try {
      final response = await http
          .get(Uri.parse('$baseUrl/api/meter-readings'))
          .timeout(const Duration(seconds: 15));

      if (response.statusCode != 200) {
        throw Exception('HTTP ${response.statusCode}');
      }

      final decoded = jsonDecode(response.body);
      if (decoded is! List) {
        throw Exception('Invalid meter readings response');
      }

      final readings = decoded
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .where((reading) {
            final waterConnection = reading['waterConnection'];

            final readingConnectionId = waterConnection is Map
                ? waterConnection['id']
                : reading['connectionId'];

            return int.tryParse('$readingConnectionId') == connectionId;
          })
          .toList();

      // Find the most recent saved reading for this connection.
      readings.sort((a, b) {
        final dateA =
            DateTime.tryParse('${a['readingDate']}') ?? DateTime(2000);
        final dateB =
            DateTime.tryParse('${b['readingDate']}') ?? DateTime(2000);

        final dateComparison = dateB.compareTo(dateA);
        if (dateComparison != 0) return dateComparison;

        final idA = int.tryParse('${a['id']}') ?? 0;
        final idB = int.tryParse('${b['id']}') ?? 0;
        return idB.compareTo(idA);
      });

      final previous = readings.isNotEmpty
          ? double.tryParse('${readings.first['currentReading']}') ?? 0.0
          : 0.0;

      if (!mounted || _selectedConnectionId != connectionId) return;

      setState(() {
        _previousController.text = _formatReading(previous);
      });
    } catch (e) {
      if (!mounted || _selectedConnectionId != connectionId) return;

      setState(() {
        _error = 'Could not load previous reading. $e';
      });
    } finally {
      if (mounted && _selectedConnectionId == connectionId) {
        setState(() => _loadingPrevious = false);
      }
    }
  }

  String _formatReading(double value) {
    return value == value.roundToDouble()
        ? value.toInt().toString()
        : value.toString();
  }

  Future<void> _saveReading() async {
    if (_selectedConnectionId == null) {
      _showMessage('Select a water connection first.');
      return;
    }

    if (_loadingPrevious) {
      _showMessage('Please wait until the previous reading loads.');
      return;
    }

    final previous = double.tryParse(_previousController.text.trim());
    final current = double.tryParse(_currentController.text.trim());

    if (previous == null ||
        current == null ||
        previous < 0 ||
        current < previous) {
      _showMessage('Enter valid readings. Current must be at least previous.');
      return;
    }

    setState(() => _saving = true);

    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/api/meter-readings'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'connectionId': _selectedConnectionId,
              'previousReading': previous,
              'currentReading': current,
              'readingDate':
                  '${_readingDate.year.toString().padLeft(4, '0')}-'
                  '${_readingDate.month.toString().padLeft(2, '0')}-'
                  '${_readingDate.day.toString().padLeft(2, '0')}',
            }),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 201 || response.statusCode == 200) {
        final result = jsonDecode(response.body);
        if (!mounted) return;

        final readingId = result is Map ? result['id'] : null;

        _currentController.clear();

        _showMessage('Reading saved successfully. Reading ID: $readingId');

        // The saved current reading becomes the next previous reading.
        await _loadPreviousReading(_selectedConnectionId!);
      } else {
        throw Exception(
          'Server returned ${response.statusCode}: ${response.body}',
        );
      }
    } catch (e) {
      _showMessage('Could not save reading: $e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  void dispose() {
    _previousController.dispose();
    _currentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final customerName = '${widget.customer['fullName'] ?? 'Customer'}';

    return Scaffold(
      appBar: AppBar(title: const Text('Enter Meter Reading')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Text(
                  customerName,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                Text(
                  'Customer ID: '
                  '${widget.customer['id'] ?? widget.customer['customerId'] ?? '-'}',
                ),
                const SizedBox(height: 20),
                if (_error != null)
                  Text(_error!, style: const TextStyle(color: Colors.red)),
                if (_connections.isEmpty && _error == null)
                  const Text(
                    'No active water connection found for this customer.',
                  ),
                if (_connections.isNotEmpty) ...[
                  DropdownButtonFormField<int>(
                    initialValue: _selectedConnectionId,
                    decoration: const InputDecoration(
                      labelText: 'Water Connection',
                      border: OutlineInputBorder(),
                    ),
                    items: _connections
                        .map((connection) {
                          final id = int.tryParse('${connection['id']}');

                          return DropdownMenuItem<int>(
                            value: id,
                            child: Text(
                              '${connection['connectionNumber'] ?? 'Connection'}'
                              ' — ${connection['connectionType'] ?? ''}',
                            ),
                          );
                        })
                        .where((item) => item.value != null)
                        .toList(),
                    onChanged: (value) {
                      if (value == null) return;

                      setState(() {
                        _selectedConnectionId = value;
                        _currentController.clear();
                      });

                      _loadPreviousReading(value);
                    },
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _previousController,
                    readOnly: true,
                    decoration: InputDecoration(
                      labelText: 'Previous Meter Reading',
                      border: const OutlineInputBorder(),
                      suffixIcon: _loadingPrevious
                          ? const Padding(
                              padding: EdgeInsets.all(12),
                              child: SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              ),
                            )
                          : const Icon(Icons.lock_outline),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _currentController,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Current Meter Reading',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Reading Date'),
                    subtitle: Text(
                      '${_readingDate.year}-'
                      '${_readingDate.month.toString().padLeft(2, '0')}-'
                      '${_readingDate.day.toString().padLeft(2, '0')}',
                    ),
                    trailing: const Icon(Icons.calendar_month),
                    onTap: () async {
                      final selected = await showDatePicker(
                        context: context,
                        initialDate: _readingDate,
                        firstDate: DateTime(2020),
                        lastDate: DateTime.now(),
                      );

                      if (selected != null && mounted) {
                        setState(() => _readingDate = selected);
                      }
                    },
                  ),
                  const SizedBox(height: 20),
                  FilledButton.icon(
                    onPressed: _saving || _loadingPrevious
                        ? null
                        : _saveReading,
                    icon: const Icon(Icons.save),
                    label: Text(_saving ? 'Saving...' : 'Save Meter Reading'),
                  ),
                ],
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: _loading || _saving ? null : _loadConnections,
                  child: const Text('Refresh Connections'),
                ),
              ],
            ),
    );
  }
}
