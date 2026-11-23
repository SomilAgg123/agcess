import json
from pathlib import Path
import unittest

from agcess_parser import ParseError, parse_field_work, parse_product, parse_sample

CASES = json.loads((Path(__file__).resolve().parents[3] / 'examples' / 'field-work-cases.json').read_text())


class FieldWorkTests(unittest.TestCase):
    def test_shared_contract(self):
        for case in CASES:
            with self.subTest(case=case['name']):
                if 'error' in case:
                    with self.assertRaises(ParseError) as error:
                        parse_field_work(case['input'])
                    self.assertEqual(error.exception.code, case['error'])
                    if 'errorLine' in case:
                        self.assertEqual(error.exception.line, case['errorLine'])
                else:
                    self.assertEqual(parse_field_work(case['input']), case['records'])

    def test_limits(self):
        for body, code in [('a' * 1601, 'too_long'), ('A-pruning-1-1\n' * 21, 'too_many_lines')]:
            with self.assertRaises(ParseError) as error:
                parse_field_work(body)
            self.assertEqual(error.exception.code, code)
        self.assertEqual(len(parse_field_work('A-pruning-1-1\n' * 20)), 20)

    def test_second_line_error(self):
        with self.assertRaises(ParseError) as error:
            parse_field_work('A-pruning-1-1\nB-wrong-1-1')
        self.assertEqual(error.exception.line, 2)


class ProductTests(unittest.TestCase):
    def test_original_mapping(self):
        result = parse_product('ExampleProduct ExampleIngredient DEMO-ID ExampleInterval ExampleEquipment')
        self.assertEqual(result[0]['Registration_number'], 'DEMO-ID')
        self.assertEqual(len(result[0]), 5)

    def test_malformed(self):
        for text in ['one two', 'one two three four five six']:
            with self.assertRaises(ParseError):
                parse_product(text)


class ResearchSampleTests(unittest.TestCase):
    def setUp(self):
        self.locations = {'DEMO1': {'field': 'Research Plot', 'crop': 'Example crop'}}

    def test_count_and_notes(self):
        result = parse_sample('DEMO1 3: morning sample', self.locations)[0]
        self.assertEqual(result['n_tubes'], 3)
        self.assertEqual(result['notes'], 'morning sample')
        self.assertNotIn('n_tubes', self.locations['DEMO1'])

    def test_coordinates(self):
        for message in ['DEMO1 42.0 -76.0', 'DEMO1 sensor 42.0 -76.0']:
            result = parse_sample(message, self.locations)[0]
            self.assertEqual((result['lat'], result['long']), (42, -76))

    def test_reject_bad_samples(self):
        for message in ['UNKNOWN 3', 'DEMO1 -1', 'DEMO1 1.5', 'DEMO1 1001', 'DEMO1 NaN 2', 'DEMO1 91 0', 'DEMO1 0 181', 'DEMO1 unknown 0 0']:
            with self.subTest(message=message), self.assertRaises(ParseError):
                parse_sample(message, self.locations)


if __name__ == '__main__':
    unittest.main()
