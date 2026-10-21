import 'dart:convert';

import 'meter_reading_page.dart';

import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';

void main() {
  runApp(const WaterFlowApp());
}

class WaterFlowApp extends StatefulWidget {
  const WaterFlowApp({super.key});

  @override
  State<WaterFlowApp> createState() => _WaterFlowAppState();
}

class _WaterFlowAppState extends State<WaterFlowApp> {
  ThemeMode _themeMode = ThemeMode.light;

  void _changeTheme(bool darkMode) {
    setState(() {
      _themeMode = darkMode ? ThemeMode.dark : ThemeMode.light;
    });
  }

  @override
  Widget build(BuildContext context) {
    const blue = Color(0xFF1677D2);

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'WaterFlow',
      themeMode: _themeMode,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: blue,
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: const Color(0xFFF4F8FD),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Color(0xFF17365D),
        ),
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: blue,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: WaterFlowHomePage(
        isDark: _themeMode == ThemeMode.dark,
        onThemeChanged: _changeTheme,
      ),
    );
  }
}

class WaterFlowHomePage extends StatelessWidget {
  final bool isDark;
  final ValueChanged<bool> onThemeChanged;

  const WaterFlowHomePage({
    super.key,
    required this.isDark,
    required this.onThemeChanged,
  });

  void _openPage(BuildContext context, Widget page) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => page));
  }

  @override
  Widget build(BuildContext context) {
    const blue = Color(0xFF1677D2);

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.water_drop, color: blue),
            SizedBox(width: 8),
            Text('WaterFlow', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Settings',
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => _openPage(
              context,
              SettingsPage(isDark: isDark, onThemeChanged: onThemeChanged),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'Water Management',
            style: Theme.of(context).textTheme.headlineSmall
                ?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          Text(
            'Welcome, Field Officer!',
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 24),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: blue,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.water_drop, color: Colors.white, size: 36),
                SizedBox(height: 12),
                Text(
                  'WaterFlow Mobile',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 23,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'Customer billing and meter reading',
                  style: TextStyle(color: Colors.white),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Quick Actions',
            style: Theme.of(context).textTheme.titleLarge
                ?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          _actionCard(
            context,
            icon: Icons.people_outline,
            title: 'Customer List',
            subtitle: 'View registered customers',
            onTap: () => _openPage(context, const CustomerListPage()),
          ),

          _actionCard(
            context,
            icon: Icons.speed,
            title: 'Enter Meter Reading',
            subtitle: 'Record the current meter reading',
            onTap: () => _showMessage(
              context,
              'Meter reading screen will be connected in the next step.',
            ),
          ),
          _actionCard(
            context,
            icon: Icons.receipt_long,
            title: 'Saved Bills',
            subtitle: 'View bills saved on this device',
            onTap: () => _showMessage(
              context,
              'Offline bill storage will be added in the next step.',
            ),
          ),
          _actionCard(
            context,
            icon: Icons.sync,
            title: 'Data Synchronization',
            subtitle: 'Offline save and automatic sync',
            onTap: () => _showMessage(
              context,
              'Automatic synchronization will be implemented next.',
            ),
          ),
          _actionCard(
            context,
            icon: Icons.settings_outlined,
            title: 'Settings',
            subtitle: 'Change app appearance',
            onTap: () => _openPage(
              context,
              SettingsPage(isDark: isDark, onThemeChanged: onThemeChanged),
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: CircleAvatar(
          backgroundColor: const Color(0xFFE5F1FF),
          child: Icon(icon, color: const Color(0xFF1677D2)),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }

  void _showMessage(BuildContext context, String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }
}

class SettingsPage extends StatelessWidget {
  final bool isDark;
  final ValueChanged<bool> onThemeChanged;

  const SettingsPage({
    super.key,
    required this.isDark,
    required this.onThemeChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Appearance', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          Card(
            child: SwitchListTile(
              secondary: Icon(isDark ? Icons.dark_mode : Icons.light_mode),
              title: const Text('Dark Theme'),
              subtitle: Text(
                isDark ? 'Dark appearance enabled' : 'Light appearance enabled',
              ),
              value: isDark,
              onChanged: onThemeChanged,
            ),
          ),
          const SizedBox(height: 16),
          const Card(
            child: ListTile(
              leading: Icon(Icons.language),
              title: Text('Language'),
              subtitle: Text(
                'English, Sinhala and Tamil options will be connected next.',
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class CustomerListPage extends StatefulWidget {
  const CustomerListPage({super.key});

  @override
  State<CustomerListPage> createState() => _CustomerListPageState();
}

class _CustomerListPageState extends State<CustomerListPage> {
  static const String apiUrl = 'http://10.0.2.2:8080/api/customers';

  final TextEditingController _searchController = TextEditingController();

  List<dynamic> _customers = [];
  bool _loading = true;
  String? _error;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _loadCustomers();
  }

  Future<void> _loadCustomers() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final customers = await loadCustomerData(apiUrl);

      if (!mounted) return;

      setState(() {
        _customers = customers;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _error = 'Cannot connect to server. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _customers.where((item) {
      if (item is! Map) return false;

      final customer = Map<String, dynamic>.from(item);
      final name = '${customer['fullName'] ?? ''}'.toLowerCase();
      final id = '${customer['id'] ?? customer['customerId'] ?? ''}'
          .toLowerCase();
      final membershipId =
          '${customer['membershipId'] ?? customer['membership_id'] ?? ''}'
              .toLowerCase();
      final phone = '${customer['phone'] ?? ''}'.toLowerCase();
      final query = _query.trim().toLowerCase();

      return name.contains(query) ||
          id.contains(query) ||
          membershipId.contains(query) ||
          phone.contains(query);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Customer List'),
        actions: [
          IconButton(
            onPressed: _loadCustomers,
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              onChanged: (value) {
                setState(() {
                  _query = value;
                });
              },
              decoration: InputDecoration(
                hintText: 'Search name, customer ID, membership ID or phone',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    setState(() {
                      _query = '';
                    });
                  },
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(_error!, textAlign: TextAlign.center),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: _loadCustomers,
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  )
                : filtered.isEmpty
                ? const Center(child: Text('No customers found.'))
                : RefreshIndicator(
                    onRefresh: _loadCustomers,
                    child: ListView.builder(
                      physics: const AlwaysScrollableScrollPhysics(),
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final customer = Map<String, dynamic>.from(
                          filtered[index] as Map,
                        );

                        final name = '${customer['fullName'] ?? 'Unknown'}';
                        final customerId =
                            '${customer['id'] ?? customer['customerId'] ?? '-'}';
                        final membershipId =
                            '${customer['membershipId'] ?? customer['membership_id'] ?? '-'}';
                        final phone = '${customer['phone'] ?? '-'}';

                        return Card(
                          margin: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 5,
                          ),
                          child: ListTile(
                            leading: CircleAvatar(
                              child: Text(
                                name.isNotEmpty ? name[0].toUpperCase() : 'C',
                              ),
                            ),
                            title: Text(name),
                            subtitle: Text(
                              'Customer ID: $customerId\n'
                              'Membership ID: $membershipId\n'
                              'Phone: $phone',
                            ),
                            isThreeLine: true,
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      MeterReadingPage(customer: customer),
                                ),
                              );
                            },
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

Future<List<dynamic>> loadCustomerData(String url) async {
  final response = await http
      .get(Uri.parse(url))
      .timeout(const Duration(seconds: 15));

  if (response.statusCode != 200) {
    throw Exception('Server returned HTTP ${response.statusCode}');
  }

  final dynamic decoded = jsonDecode(response.body);

  if (decoded is! List) {
    throw Exception('Expected a list of customers from the server.');
  }

  return decoded;
}
