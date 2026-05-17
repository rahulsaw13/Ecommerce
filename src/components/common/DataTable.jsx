import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Skeleton } from 'primereact/skeleton';

const Datatable = ({ columns, data=[], skip, rows, total, loader, className, showGridlines, paginationChangeHandler }) => {
  const items = Array?.from({ length: 5 }, (v, i) => i);

  return (
    <div className="table-container">
      <DataTable
        value={data?.length === 0 && loader ? items : data}
        tableStyle={{ minWidth: "50rem", tableLayout: "fixed" }}
        className={className}
        showGridlines={showGridlines}
        paginator
        lazy 
        totalRecords={total}
        first={skip}
        rows={rows}
        onPage={e => {
          paginationChangeHandler(e.first, e.rows)
        }}
        rowsPerPageOptions={[10, 25, 50]}
      >
        {columns?.map((col, i) => (
          <Column
            key={i}
            field={col?.field}
            header={col?.header}
            style={col?.style}
            bodyStyle={col?.bodyStyle || col?.style}
            body={loader ? (col?.skeletonBody || <Skeleton />) : col?.body}
            className="capitalize"
            headerStyle={col.headerStyle || col?.style}
          />
        ))}
      </DataTable>
    </div>
  );
};

export default Datatable;
