import { TreeTable } from 'primereact/treetable';
import { Column } from "primereact/column";
import { useState } from 'react';

const NestedDatatable = ({ columns, data = [], className, showGridlines }) => {
  const [expandedRows, setExpandedRows] = useState(null);

  const allowExpansion = (rowData) => {
    return rowData?.children?.length > 0;
  };
  
  return (
    <div>
      <TreeTable 
          value={data} 
          expandedRows={expandedRows} 
          onRowToggle={(e) => setExpandedRows(e.data)}
          dataKey="id"  
          tableStyle={{ minWidth: "50rem" }}
          className={className}
          showGridlines={showGridlines}
          paginator
          rows={5}
          rowsPerPageOptions={[5, 10, 25, 50]}
          >
          <Column expander={allowExpansion} style={{ width: '5rem' }} />
          {columns?.map((col, i) => (
              <Column
                key={i}
                field={col?.field}
                header={col?.header}
                body={col?.body}
                className="capitalize"
                headerStyle={col.headerStyle}
              />
            ))}
      </TreeTable >
    </div>
  );
};

export default NestedDatatable;
