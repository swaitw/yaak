import type { Extension, TransactionSpec } from '@codemirror/state';
import { EditorSelection, EditorState, Transaction } from '@codemirror/state';

export function singleLineExtensions(): Extension {
  return EditorState.transactionFilter.of(
    (tr: Transaction): TransactionSpec | readonly TransactionSpec[] => {
      if (!tr.isUserEvent('input') || tr.isUserEvent('input.type.compose')) return tr;

      const changes: { from: number; to: number; insert: string }[] = [];

      tr.changes.iterChanges((_fromA, toA, fromB, _toB, inserted) => {
        let insert = '';
        for (const line of inserted.iterLines()) {
          insert += line.replace(/\n/g, '');
        }

        if (insert !== inserted.toString()) {
          changes.push({ from: fromB, to: toA, insert });
        }
      });

      const lastChange = changes[changes.length - 1];
      if (lastChange == null) return tr;

      const selection = EditorSelection.cursor(lastChange.from + lastChange.insert.length);

      return {
        changes,
        selection,
        userEvent: tr.annotation(Transaction.userEvent) ?? undefined,
      };
    },
  );
}
