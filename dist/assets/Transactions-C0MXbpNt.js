import{u as c,a as m,r as x,f as i,j as t,H as p,m as h,T as u}from"./index-Cw4na5-h.js";import{R as f}from"./ReloadOutlined-BjYTlAs_.js";import{F as g}from"./Table-Oqh_TNff.js";import{T as r}from"./index-r4pXHkro.js";import"./index-TPGMNnsO.js";import"./Overflow-BUg5VpaG.js";import"./index-C1tnOISS.js";import"./SearchOutlined-BrXoOTqQ.js";import"./index-1kAGXf5x.js";import"./LeftOutlined-UTz-YvzJ.js";import"./EllipsisOutlined-BzHJ4aU7.js";import"./index-lCzvkxk9.js";import"./useBreakpoint-CJyyHhm2.js";import"./Pagination-DXIbrPbi.js";import"./index-BFGWsMsu.js";import"./Input-BFoDubZP.js";const E=()=>{const s=c(),{transactions:o,loading:d}=m(e=>e.user);x.useEffect(()=>{s(i())},[s]);const l=[{title:"Date",dataIndex:"createdAt",key:"createdAt",render:e=>new Date(e).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"}),sorter:(e,a)=>new Date(e.createdAt)-new Date(a.createdAt),defaultSortOrder:"descend"},{title:"Type",dataIndex:"type",key:"type",render:e=>t.jsx(r,{color:e==="subscription"?"blue":"gold",className:"text-xs sm:text-sm",children:e.replace(/_/g," ").toUpperCase()})},{title:"Plan",dataIndex:"plan",key:"plan",render:e=>e?t.jsx(r,{color:"purple",className:"text-xs sm:text-sm",children:e.toUpperCase()}):"-"},{title:"Credits",dataIndex:"creditsAdded",key:"creditsAdded",render:e=>t.jsx("span",{className:"text-xs sm:text-sm",children:e||0})},{title:"Amount",dataIndex:"amount",key:"amount",render:(e,a)=>{var n;return t.jsx("span",{className:"text-xs sm:text-sm",children:`$${(e/100).toFixed(2)} ${(n=a.currency)==null?void 0:n.toUpperCase()}`})}},{title:"Payment Method",dataIndex:"paymentMethod",key:"paymentMethod",responsive:["md"],render:e=>t.jsx("span",{className:"text-xs sm:text-sm",children:(e==null?void 0:e.toUpperCase())||"-"})},{title:"Status",dataIndex:"status",key:"status",render:e=>{let a="default";return e==="success"?a="green":e==="failed"?a="red":e==="pending"&&(a="orange"),t.jsx(r,{color:a,className:"text-xs sm:text-sm",children:e.toUpperCase()})},filters:[{text:"Success",value:"success"},{text:"Pending",value:"pending"},{text:"Failed",value:"failed"}],onFilter:(e,a)=>a.status===e},{title:"Invoice",dataIndex:"invoiceUrl",key:"invoiceUrl",responsive:["md"],render:e=>e?t.jsx("a",{href:e,target:"_blank",rel:"noreferrer",className:"text-blue-500 underline hover:text-blue-700 text-xs sm:text-sm",children:"View Invoice"}):"-"}];return t.jsxs(t.Fragment,{children:[t.jsx(p,{children:t.jsx("title",{children:"Transactions | GenWrite"})}),t.jsxs(h.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{duration:.4},className:"p-8 bg-white rounded-xl shadow-md max-w-full",children:[t.jsxs("div",{className:"flex flex-row justify-between items-center mb-4 sm:mb-6 gap-3",children:[t.jsx("h2",{className:"text-lg sm:text-xl md:text-2xl font-semibold text-gray-800",children:"Your Transactions"}),t.jsx(u,{title:"Refresh",children:t.jsx("button",{onClick:()=>s(i()),className:"px-3 sm:px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition text-sm flex items-center justify-center",children:t.jsx(f,{className:"w-4 sm:w-5 h-4 sm:h-5"})})})]}),t.jsx("style",{children:`
            .ant-table-container {
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
            }
            .ant-table-thead {
              position: sticky;
              top: 0;
              z-index: 10;
              background: #fafafa;
            }
            .ant-table-thead > tr > th {
              background: #fafafa !important;
              white-space: nowrap;
            }
            .ant-table-cell {
              white-space: nowrap;
            }
            @media (max-width: 640px) {
              .ant-table-tbody > tr > td {
                padding: 8px !important;
                font-size: 12px !important;
              }
              .ant-table-thead > tr > th {
                padding: 8px !important;
                font-size: 12px !important;
              }
              .ant-tag {
                font-size: 12px !important;
                padding: 2px 6px !important;
              }
            }
            @media (max-width: 768px) {
              .ant-table-tbody > tr > td {
                padding: 10px !important;
              }
              .ant-table-thead > tr > th {
                padding: 10px !important;
              }
            }
          `}),t.jsx(g,{rowKey:"_id",loading:d,dataSource:o,columns:l,pagination:{pageSize:10,responsive:!0,showSizeChanger:!1},className:"rounded-lg overflow-hidden",rowClassName:"hover:bg-gray-50 transition-colors duration-200",scroll:{x:"max-content"}})]})]})};export{E as default};
