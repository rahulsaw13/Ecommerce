import { useState, useEffect } from 'react';
import { TreeTable } from "primereact/treetable";
import { Column } from "primereact/column";
import { Skeleton } from 'primereact/skeleton';

const TreeTableComponent = ({ columns, data=[], skip, rows, total, loader, className, showGridlines, paginationChangeHandler }) => {
  const [expandedKeys, setExpandedKeys] = useState({});
  
  const items = Array?.from({ length: 5 }, (v, i) => ({
    key: `skeleton-${i}`,
    data: {},
    children: []
  }));

  // Initialize expandedKeys as empty (collapsed by default)
  useEffect(() => {
    if (data && data.length > 0 && !loader) {
      // Start with all groups collapsed
      setExpandedKeys({});
    }
  }, [data, loader]);

  return (
    <div className="table-container">
      <TreeTable
        value={data?.length === 0 && loader ? items : data}
        tableStyle={{ minWidth: "50rem" }}
        className={`${className} custom-tree-table`}
        showGridlines={showGridlines}
        paginator
        rows={rows}
        totalRecords={total}
        lazy
        first={skip}
        onPage={(e) => {
          if (paginationChangeHandler) {
            paginationChangeHandler(e.first, e.rows);
          }
        }}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
        rowsPerPageOptions={[5, 10, 25, 50]}
        paginatorClassName="p-paginator-bottom"
        expandedKeys={expandedKeys}
        onToggle={(e) => setExpandedKeys(e.value)}
      >
        {columns?.map((col, index) => {
          if (col.body) {
            return (
              <Column
                key={index}
                field={col.field}
                header={col.header}
                body={loader && data?.length === 0 ? () => <Skeleton /> : col.body}
                headerStyle={col.headerStyle}
                bodyStyle={col.bodyStyle}
                bodyClassName={col.bodyClassName}
                style={col.style}
                expander={col.expander}
              />
            );
          } else {
            return (
              <Column
                key={index}
                field={col.field}
                header={col.header}
                body={loader && data?.length === 0 ? () => <Skeleton /> : undefined}
                headerStyle={col.headerStyle}
                bodyStyle={col.bodyStyle}
                bodyClassName={col.bodyClassName}
                style={col.style}
                expander={col.expander}
              />
            );
          }
        })}
      </TreeTable>
      
      {/* Custom styles for professional look */}
      <style jsx>{`
        .custom-tree-table .p-treetable-thead > tr > th {
          background-color: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
          font-weight: 600;
          color: #495057;
          padding: 12px 8px;
        }
        
        .custom-tree-table .p-treetable-tbody > tr > td {
          padding: 10px 8px;
          border-bottom: 1px solid #dee2e6;
        }
        
        .custom-tree-table .p-treetable-tbody > tr:hover {
          background-color: #f8f9fa;
        }
        
        .custom-tree-table .p-treetable-toggler {
          color: #6c757d;
          margin-right: 8px;
        }
        
        .custom-tree-table .p-treetable-toggler:hover {
          color: #495057;
        }
        
        .custom-tree-table .p-treetable-tbody > tr.p-treetable-row-expanded > td {
          background-color: #f1f3f4;
        }
      `}</style>
    </div>
  );
};

export default TreeTableComponent;
