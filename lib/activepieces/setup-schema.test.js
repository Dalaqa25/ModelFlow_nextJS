import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildActivepiecesInputForResolver,
  buildActivepiecesRequiredInput,
  getOptionMode,
  normalizeActivepiecesOptionsResponse,
  normalizeSetupInputs,
} from './setup-schema.js';

const step = {
  name: 'add_row',
  displayName: 'Add Row',
  settings: {
    pieceName: '@activepieces/piece-google-sheets',
    pieceVersion: '0.12.3',
    actionName: 'insert_row',
  },
};

test('distinguishes static, dynamic, and multi-select option modes', () => {
  assert.equal(getOptionMode('STATIC_DROPDOWN'), 'static_options');
  assert.equal(getOptionMode('STATIC_MULTI_SELECT_DROPDOWN'), 'static_multi_select');
  assert.equal(getOptionMode('DROPDOWN'), 'dynamic_options');
  assert.equal(getOptionMode('MULTI_SELECT_DROPDOWN'), 'dynamic_multi_select');
  assert.equal(getOptionMode('DYNAMIC'), 'dynamic_fields');
});

test('preserves resolver metadata and static choices in the setup contract', () => {
  const input = buildActivepiecesRequiredInput({
    step,
    definition: { displayName: 'Add Row' },
    pieceName: '@activepieces/piece-google-sheets',
    pieceSlug: 'google-sheets',
    propName: 'valueMode',
    prop: {
      displayName: 'Value Mode',
      type: 'STATIC_DROPDOWN',
      required: true,
      refreshOnSearch: true,
      options: { options: [{ label: 'Raw', value: 'RAW' }] },
    },
    order: 0,
  });

  assert.equal(input.optionMode, 'static_options');
  assert.equal(input.refreshOnSearch, true);
  assert.deepEqual(input.options, [{ label: 'Raw', value: 'RAW' }]);
});

test('combines fixed step inputs with customer values and preserves numeric zero', () => {
  const inputs = normalizeSetupInputs([
    {
      name: 'add_row.spreadsheetId',
      fieldKey: 'ADD_ROW.SPREADSHEETID',
      stepName: 'add_row',
      propName: 'spreadsheetId',
      type: 'select',
      propType: 'DROPDOWN',
      source: 'activepieces',
    },
    {
      name: 'add_row.sheetId',
      fieldKey: 'ADD_ROW.SHEETID',
      stepName: 'add_row',
      propName: 'sheetId',
      type: 'select',
      propType: 'DROPDOWN',
      source: 'activepieces',
    },
  ]);

  const resolved = buildActivepiecesInputForResolver(
    inputs,
    {
      'ADD_ROW.SPREADSHEETID': 'spreadsheet-123',
      'ADD_ROW.SHEETID': 0,
    },
    inputs[1],
    { includeTeamDrives: false, first_row_headers: true },
  );

  assert.deepEqual(resolved, {
    includeTeamDrives: false,
    first_row_headers: true,
    spreadsheetId: 'spreadsheet-123',
    sheetId: 0,
  });
});

test('decodes Activepieces nested dropdown responses without mistaking them for dynamic fields', () => {
  const result = normalizeActivepiecesOptionsResponse({
    type: 'DROPDOWN',
    options: {
      disabled: false,
      placeholder: 'Select a spreadsheet',
      options: [
        { label: 'June Invoices', value: 'spreadsheet-123' },
        { label: 'Sheet with zero', value: 0 },
      ],
    },
  });

  assert.equal(result.kind, 'options');
  assert.equal(result.placeholder, 'Select a spreadsheet');
  assert.deepEqual(result.options, [
    { label: 'June Invoices', value: 'spreadsheet-123' },
    { label: 'Sheet with zero', value: 0 },
  ]);
  assert.deepEqual(result.dynamicFields, []);
});

test('decodes generated Activepieces property maps', () => {
  const result = normalizeActivepiecesOptionsResponse({
    type: 'DYNAMIC',
    options: {
      total: { displayName: 'Invoice Total', type: 'NUMBER', required: true },
      status: {
        displayName: 'Status',
        type: 'STATIC_DROPDOWN',
        required: false,
        options: { options: [{ label: 'Paid', value: 'paid' }] },
      },
    },
  });

  assert.equal(result.kind, 'dynamic_fields');
  assert.deepEqual(result.dynamicFields.map(field => field.name), ['total', 'status']);
  assert.deepEqual(result.dynamicFields[1].options, [{ label: 'Paid', value: 'paid' }]);
});
