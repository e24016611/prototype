import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {
  CellContext,
  Row,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import React, { MouseEvent, useEffect, useRef, useState } from 'react';
import { FooterCell } from './editable-table-footer';
import './table.module.css';

const EDIT = 'edit';
const COLLAPSE = 'collapse';

const CollapseCell: (context: CellContext<any, any>) => React.ReactNode = ({
  table,
  row,
}) => {
  const [open, setOpen] = useState(false);
  const meta = table.options.meta as any;
  const toggleCollapse = (e: MouseEvent<HTMLButtonElement>) => {
    setOpen(!open);
    meta?.setCollapseRows((old: any) => {
      return { ...old, [row.id]: !old[row.id] };
    }, console.log(`collapseRows = ${JSON.stringify(meta?.collapseRows)}`));
  };

  return (
    <IconButton aria-label="expand row" size="small" onClick={toggleCollapse}>
      {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
    </IconButton>
  );
};

const DataCell: (context: CellContext<any, any>) => React.ReactNode = ({
  getValue,
  row,
  column,
  table,
}) => {
  const meta = table.options.meta as any;
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  const [inputWidth, setInputWidth] = useState('auto');
  const cellRef = useRef<HTMLDivElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    setIsEditMode(meta?.editedRows[row.id] || false);
  }, [meta?.editedRows, row.id]);

  useEffect(() => {
    if (cellRef.current) {
      const width = cellRef.current.offsetWidth;
      setInputWidth(`${width}px`);
    }
  }, [isEditMode, value]);

  const onBlur = () => {
    meta?.updateData(row.id, row.index, column.id, value);
  };

  if (typeof value === 'boolean') {
    return (
      <input
        type="checkbox"
        checked={value}
        onChange={isEditMode ? (e) => setValue(!value) : undefined}
        onBlur={onBlur}
        readOnly={!isEditMode}
      />
    );
  }

  return (
    <div ref={cellRef} style={{ width: '100%' }}>
      {isEditMode ? (
        <input
          style={{ width: inputWidth }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
        />
      ) : (
        <span>{meta.cellReplace(value)}</span>
      )}
    </div>
  );
};

const EditCell: (context: CellContext<any, any>) => React.ReactNode = ({
  row,
  table,
}) => {
  const meta = table.options.meta as any;
  const setEditedRows = (e: MouseEvent<HTMLButtonElement>) => {
    meta?.setEditedRows((old: any) => ({
      ...old,
      [row.id]: !old[row.id],
    }));
  };
  const removeRow = () => {
    meta?.removeRow(row.id, row.index);
  };
  return (
    meta.isRowEditable(row) && (
      <div className="edit-cell-container">
        {meta?.editedRows[row.id] ? (
          <div className="edit-cell-action">
            <button onClick={setEditedRows} name="done">
              ✔
            </button>
          </div>
        ) : (
          <div className="edit-cell-action">
            <IconButton onClick={setEditedRows} name="edit">
              <EditIcon></EditIcon>
            </IconButton>
            <IconButton onClick={removeRow} name="remove">
              <ClearIcon></ClearIcon>
            </IconButton>
          </div>
        )}
      </div>
    )
  );
};
interface EditableTableProps {
  data: any[];
  setData: (data: any[] | ((prev: any) => any)) => void;
  isEditable: boolean;
  toDisplay?: (ori: string) => string;
  ignoredHeader?: Set<string>;
  columnOrder?: string[];
  displayFilter?: (row: any) => boolean;
  addNewRow?: () => void;
  updateData?: (
    rowId: string,
    rowIndex: number,
    columnId: string,
    value: string
  ) => void;
  removeRow?: (rowId: string, rowIndex: number) => void;
  cellReplace?: (value: string) => string;
  isRowEditable?: (row: any) => boolean;
  isCollapsible?: boolean;
  getRowId?: (originalRow: any, index: number, parent?: Row<any>) => string;
}

export default function EditableTable(props: EditableTableProps) {
  let data = props.data;
  let setData = props.setData;
  let isEditable = props.isEditable;
  let toDisplay = props.toDisplay ? props.toDisplay : (ori: string) => ori;
  let ignoredHeader = props.ignoredHeader
    ? props.ignoredHeader
    : new Set<string>(['id']);
  let columnOrder = props.columnOrder;
  let displayFilter = props.displayFilter ? props.displayFilter : () => true;
  let removeRow = props.removeRow;
  let updateData = props.updateData;
  let addNewRow = props.addNewRow;
  let cellReplace = props.cellReplace ?? ((value: string) => value);
  let isRowEditable = props.isRowEditable ?? ((row) => true);
  let isCollapsible = props.isCollapsible ?? false;
  let getRowId =
    props.getRowId ??
    ((originalRow: any, index: number, parent?: Row<any>) => index.toString());

  const columns: any[] = [];
  const columnHelper = createColumnHelper<any>();
  const [editedRows, setEditedRows] = useState({});
  const [collapseRows, setCollapseRows] = useState({});

  for (let key in data[0]) {
    if (typeof key === 'string' && !ignoredHeader.has(key)) {
      columns.push(
        columnHelper.accessor(key, {
          header: toDisplay(key),
          cell: DataCell,
        })
      );
    }
  }
  if (isEditable) {
    columns.push(
      columnHelper.display({
        id: EDIT,
        cell: EditCell,
      })
    );
  }

  if (isCollapsible) {
    columns.unshift(
      columnHelper.display({
        id: COLLAPSE,
        cell: CollapseCell,
      })
    );

    columnOrder?.unshift(COLLAPSE);
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnOrder: columnOrder,
    },
    meta: {
      updateData: (
        rowId: string,
        rowIndex: number,
        columnId: string,
        value: string
      ) => {
        if (updateData) {
          updateData(rowId, rowIndex, columnId, value);
        } else {
          setData((old) =>
            old.map((row: any, index: number) => {
              if (index === rowIndex) {
                let data: string | number = value;
                if (typeof old[rowIndex][columnId] == 'number') {
                  if (!isNaN(+value)) data = Number.parseInt(value);
                  else data = old[rowIndex][columnId];
                }
                return {
                  ...old[rowIndex],
                  [columnId]: data,
                };
              }
              return row;
            })
          );
        }
      },
      editedRows,
      setEditedRows,
      addRow: () => {
        if (addNewRow) {
          addNewRow();
        } else {
          let temp: any = {};
          for (const key in data[0]) {
            if (Object.prototype.hasOwnProperty.call(data[0], key)) {
              const element = data[0][key];
              if (typeof element === 'string') {
                temp[key] = ' ';
              } else if (typeof element === 'number') {
                temp[key] = 0;
              }
            }
          }

          const setFunc = (old: any[]) => [...old, temp];
          setData(setFunc);
        }
      },
      removeRow: (rowId: string, rowIndex: number) => {
        if (removeRow) {
          removeRow(rowId, rowIndex);
        } else {
          const setFilterFunc = (old: any[]) =>
            old.filter((_row, index: number) => index !== rowIndex);
          setData(setFilterFunc);
        }
      },
      cellReplace: cellReplace,
      isRowEditable: isRowEditable,
      collapseRows: collapseRows,
      setCollapseRows: setCollapseRows,
    },
    getRowId: getRowId,
  });

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: '40vh' }}>
        <Table stickyHeader>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table
              .getRowModel()
              .rows.filter(displayFilter)
              .map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {isCollapsible && (
                    <TableRow>
                      <TableCell
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                        colSpan={row.getAllCells().length}
                      >
                        <Collapse
                          in={(table.options.meta as any)?.collapseRows[row.id]}
                          timeout="auto"
                          unmountOnExit
                        ></Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      {isEditable && (
        <TableFooter>
          <TableRow>
            <TableCell colSpan={table.getAllLeafColumns().length} align="right">
              <FooterCell table={table} />
            </TableCell>
          </TableRow>
        </TableFooter>
      )}
    </Paper>
  );
}
