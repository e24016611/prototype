import { Table } from '@tanstack/react-table';

export const FooterCell = ({ table }: { table: Table<any> }) => {
  const meta = table.options.meta as any;
  return (
    <div className="footer-buttons">
      <button className="add-button" onClick={meta?.addRow}>
        Add New +
      </button>
    </div>
  );
};
