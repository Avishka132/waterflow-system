
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class CustomerSearchPage extends StatefulWidget {
  const CustomerSearchPage({super.key});

  @override
  State<CustomerSearchPage> createState() =>
      _CustomerSearchPageState();
}

class _CustomerSearchPageState extends State<CustomerSearchPage> {
  static const String baseUrl = 'http://10.0.2.2:8080';

  // DEMO ONLY: Replace with backend tariff calculation.
  static const double demoRatePerUnit = 50.0;

  final TextEditingController _searchController =
      TextEditingController();
  final TextEditingController _previousController =
      TextEditingController();
  final TextEditingController _currentController =
      TextEditingController();

  List<dynamic> _customers = [];
  List<dynamic> _results = [];

  Map<String, dynamic>? _selectedCustomer;

  bool _isLoading = false;
  bool _hasSearched = false;
  String? _errorMessage;

  double? _unitsUsed;
  double? _demoAmount;

  Future<void> _searchCustomers() async {
    final query = _searchController.text.trim().toLowerCase();

    if (query.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter Customer ID or Membership ID.';
        _results = [];
        _hasSearched = true;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _results = [];
      _selectedCustomer = null;
      _unitsUsed = null;
      _demoAmount = null;
      _hasSearched = true;
    });

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/customers'),
      );

      if (response.statusCode != 200) {
        throw Exception('Server returned HTTP ${response.statusCode}');
      }

      final dynamic decoded = jsonDecode(response.body);

      if (decoded is! List) {
        throw Exception('Expected a JSON list of customers.');
      }

      _customers = decoded;

      final matches = _customers.where((customer) {
        if (customer is! Map<String, dynamic>) {
          return false;
        }

        final customerId = (
          customer['customerId'] ??
          customer['customer_id'] ??
          customer['id'] ??
          ''
        ).toString().toLowerCase();

        final membershipId = (
          customer['membershipId'] ??
          customer['membership_id'] ??
          ''
        ).toString().toLowerCase();

        return customerId == query || membershipId == query;
      }).toList();

      if (!mounted) return;

      setState(() {
        _results = matches;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _errorMessage =
            'Could not load customers. Check Spring Boot and the API URL.\n$e';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _selectCustomer(Map<String, dynamic> customer) {
    setState(() {
      _selectedCustomer = customer;
      _previousController.clear();
      _currentController.clear();
      _unitsUsed = null;
      _demoAmount = null;
      _errorMessage = null;
    });
  }

  void _calculateDemoBill() {
    final previous =
        double.tryParse(_previousController.text.trim());
    final current =
        double.tryParse(_currentController.text.trim());

    if (previous == null || current == null ||
        previous < 0 || current < previous) {
      setState(() {
        _errorMessage =
            'Enter valid readings. Current reading must be at least the previous reading.';
        _unitsUsed = null;
        _demoAmount = null;
      });
      return;
    }

    final units = current - previous;

    setState(() {
      _errorMessage = null;
      _unitsUsed = units;
      _demoAmount = units * demoRatePerUnit;
    });
  }

  void _printBillPlaceholder() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Bluetooth printing is not connected yet. '
          'First configure and test your printer model.',
        ),
      ),
    );
  }

  String _value(dynamic value) =>
      value == null || value.toString().trim().isEmpty
          ? '-'
          : value.toString();

  @override
  void dispose() {
    _searchController.dispose();
    _previousController.dispose();
    _currentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const blue = Color(0xFF1677D2);
    const navy = Color(0xFF17365D);

    return Scaffold(
      backgroundColor: const Color(0xFFF4F8FC),
      appBar: AppBar(
        title: const Text(
          'Customer & Water Bill',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        foregroundColor: navy,
      ),
      body: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          const Text(
            'Find a Customer',
            style: TextStyle(
              fontSize: 23,
              fontWeight: FontWeight.bold,
              color: navy,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Search using Customer ID or Membership ID.',
            style: TextStyle(color: Colors.blueGrey),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _searchController,
            textInputAction: TextInputAction.search,
            onSubmitted: (_) => _searchCustomers(),
            decoration: InputDecoration(
              hintText: 'Enter customer or membership ID',
              prefixIcon: const Icon(Icons.search),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 48,
            child: ElevatedButton.icon(
              onPressed: _isLoading ? null : _searchCustomers,
              icon: const Icon(Icons.search),
              label: const Text('Search Customer'),
              style: ElevatedButton.styleFrom(
                backgroundColor: blue,
                foregroundColor: Colors.white,
              ),
            ),
          ),
          if (_isLoading) ...[
            const SizedBox(height: 18),
            const Center(child: CircularProgressIndicator()),
          ],
          if (_errorMessage != null) ...[
            const SizedBox(height: 14),
            Text(
              _errorMessage!,
              style: const TextStyle(color: Colors.red),
            ),
          ],
          if (!_isLoading &&
              _hasSearched &&
              _errorMessage == null &&
              _results.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 16),
              child: Text('No matching customer found.'),
            ),
          ..._results.map((item) {
            final customer =
                Map<String, dynamic>.from(item as Map);
            final selected = _selectedCustomer?['id'] ==
                customer['id'];

            return Card(
              margin: const EdgeInsets.only(top: 12),
              color: selected ? const Color(0xFFE5F1FF) : Colors.white,
              child: ListTile(
                leading: const CircleAvatar(
                  child: Icon(Icons.person),
                ),
                title: Text(
                  _value(customer['fullName']),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                subtitle: Text(
                  'ID: ${_value(customer['id'])}\n'
                  'Membership: ${_value(customer['membershipId'])}\n'
                  'Phone: ${_value(customer['phone'])}',
                ),
                isThreeLine: true,
                trailing: ElevatedButton(
                  onPressed: () => _selectCustomer(customer),
                  child: Text(selected ? 'Selected' : 'Select'),
                ),
              ),
            );
          }),
          if (_selectedCustomer != null) ...[
            const SizedBox(height: 24),
            const Text(
              'Enter Meter Readings',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: navy,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Customer: ${_value(_selectedCustomer!['fullName'])}',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _previousController,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: const InputDecoration(
                labelText: 'Previous Meter Reading',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _currentController,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: const InputDecoration(
                labelText: 'Current Meter Reading',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 14),
            SizedBox(
              height: 48,
              child: ElevatedButton.icon(
                onPressed: _calculateDemoBill,
                icon: const Icon(Icons.calculate),
                label: const Text('Calculate Demo Bill'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: blue,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
            if (_unitsUsed != null && _demoAmount != null) ...[
              const SizedBox(height: 18),
              Card(
                color: Colors.white,
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Bill Preview — DEMO ONLY',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: navy,
                        ),
                      ),
                      const Divider(height: 24),
                      _detail(
                        'Customer ID',
                        _value(_selectedCustomer!['id']),
                      ),
                      _detail(
                        'Membership ID',
                        _value(_selectedCustomer!['membershipId']),
                      ),
                      _detail(
                        'Previous Reading',
                        _previousController.text,
                      ),
                      _detail(
                        'Current Reading',
                        _currentController.text,
                      ),
                      _detail(
                        'Units Used',
                        _unitsUsed!.toStringAsFixed(0),
                      ),
                      _detail(
                        'Demo Rate',
                        'LKR ${demoRatePerUnit.toStringAsFixed(2)} / unit',
                      ),
                      const Divider(height: 24),
                      Text(
                        'DEMO TOTAL: LKR ${_demoAmount!.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: blue,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Not a real bill. Tariff, fixed charges, '
                        'and backend saving are not configured.',
                        style: TextStyle(
                          color: Colors.red,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: _printBillPlaceholder,
                          icon: const Icon(Icons.print),
                          label: const Text(
                            'Connect Bluetooth Printer',
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _detail(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 145,
            child: Text(
              label,
              style: const TextStyle(color: Colors.blueGrey),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
