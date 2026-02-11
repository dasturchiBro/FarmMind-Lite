import 'package:flutter_test/flutter_test.dart';

import 'package:farmmind_lite/main.dart';

void main() {
  testWidgets('App loads', (WidgetTester tester) async {
    await tester.pumpWidget(const FarmMindApp());
    await tester.pumpAndSettle();
    expect(find.text('FarmMind Lite'), findsWidgets);
  });
}
