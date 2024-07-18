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
    meta?.updateData(row.index, column.id, value);
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
    meta?.removeRow(row.index);
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
  displayOrder?: string[];
  displayFilter?: (row: any) => boolean;
  removeRowFunc?: (rowIndex: number) => (old: any[]) => any[];
  newRow?: () => any;
  setIsUserInput?: (isUserInput: boolean) => void;
  cellReplace?: (value: string) => string;
  isRowEditable?: (row: any) => boolean;
  isCollapsible?: boolean;
}

const history = [
  {
    date: '2020-01-05',
    customerId: '11091700',
    amount: 3,
  },
  {
    date: '2020-01-02',
    customerId: 'Anonymous',
    amount: 1,
  },
];

export default function EditableTable(props: EditableTableProps) {
  let data = props.data;
  let setData = props.setData;
  let isEditable = props.isEditable;
  let toDisplay: (ori: string) => string = props.toDisplay
    ? props.toDisplay
    : (ori) => ori;
  let ignoredHeader: Set<string> = props.ignoredHeader
    ? props.ignoredHeader
    : new Set<string>(['id']);
  let displayOrder: string[] | undefined = props.displayOrder;
  let displayFilter: (row: any) => boolean = props.displayFilter
    ? props.displayFilter
    : () => true;
  let removeRowFunc: (rowIndex: number) => (old: any[]) => any[] =
    props.removeRowFunc
      ? props.removeRowFunc
      : (rowIndex: number) => (old: any[]) =>
          old.filter((_row, index: number) => index !== rowIndex);
  let newRow: (() => any) | undefined = props.newRow;
  let setIsUserInput = props.setIsUserInput;
  let cellReplace: (value: string) => string =
    props.cellReplace ?? ((value: string) => value);
  let isRowEditable: (row: any) => boolean =
    props.isRowEditable ?? ((row) => true);
  let isCollapsible = props.isCollapsible ?? false;

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

    displayOrder?.unshift(COLLAPSE);
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnOrder: displayOrder,
    },
    meta: {
      updateData: (rowIndex: number, columnId: string, value: string) => {
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
        if (setIsUserInput) {
          setIsUserInput(true);
        }
      },
      editedRows,
      setEditedRows,
      addRow: () => {
        let temp: any;
        if (newRow) {
          temp = newRow();
        } else {
          temp = {};
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
        }
        const setFunc = (old: any[]) => [...old, temp];
        setData(setFunc);
        if (setIsUserInput) {
          setIsUserInput(true);
        }
      },
      removeRow: (rowIndex: number) => {
        const setFilterFunc = removeRowFunc(rowIndex);
        setData(setFilterFunc);
        if (setIsUserInput) {
          setIsUserInput(true);
        }
      },
      cellReplace: cellReplace,
      isRowEditable: isRowEditable,
      collapseRows: collapseRows,
      setCollapseRows: setCollapseRows,
    },
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
                        >
                          <EditableTable
                            data={history}
                            setData={(data) => data}
                            isEditable={true}
                          ></EditableTable>
                        </Collapse>
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
