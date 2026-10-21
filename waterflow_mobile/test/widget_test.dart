
import 'package:flutter_test/flutter_test.dart';
import 'package:waterflow_mobile/main.dart';

void main() {
  testWidgets('WaterFlow home page displays correctly',
      (WidgetTester tester) async {
    await tester.pumpWidget(const WaterFlowApp());

    expect(find.text('WaterFlow'), findsWidgets);
    expect(find.text('Water Management'), findsOneWidget);
    expect(find.text('Quick Actions'), findsOneWidget);
  });
}
