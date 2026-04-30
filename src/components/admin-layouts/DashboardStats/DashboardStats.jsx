// Utils
import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import Chart from "react-apexcharts";
import { useTranslation } from "react-i18next";

// Components
import { API_CONSTANTS } from "@constants/apiurl";
import { allApiWithHeaderToken } from "@api/api";
import { Toast } from "primereact/toast";

// SVG Icons with base color
const CategoriesSvg = () => (
  <svg width="35" height="35" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6H20V8H4V6ZM4 11H20V13H4V11ZM4 16H20V18H4V16Z" fill="#b69754"/>
  </svg>
);

const SubCategoriesSvg = () => (
  <svg width="35" height="35" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3H21V5H3V3ZM4 7H20V9H4V7ZM5 11H19V13H5V11ZM6 15H18V17H6V15ZM7 19H17V21H7V19Z" fill="#b69754"/>
  </svg>
);

const OrderSvg = () => (
  <svg width="35" height="35" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4H20C20.5523 4 21 4.44772 21 5V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V5C3 4.44772 3.44772 4 4 4ZM5 6V18H19V6H5ZM7 8H17V10H7V8ZM7 12H17V14H7V12Z" fill="#b69754"/>
  </svg>
);

const ProductSvg = () => (
  <svg width="35" height="35" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2ZM8 21L9.5 15.5L15 17L9.5 18.5L8 21ZM19 21L17.5 15.5L12 17L17.5 18.5L19 21Z" fill="#b69754"/>
  </svg>
);

const RevenueSvg = () => (
  <svg width="35" height="35" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2ZM12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4ZM11 6H13V8H15V10H13V14H15V16H13V18H11V16H9V14H11V10H9V8H11V6Z" fill="#b69754"/>
  </svg>
);

const CustomersSvg = () => (
  <svg width="35" height="35" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#b69754"/>
  </svg>
);

const DashboardStats = () => {
  const toast = useRef(null);
  const location = useLocation();
  const { isLogin } = location?.state || {};
  const { t } = useTranslation("msg");
  const [loader, setLoader] = useState(false);
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    productCounts: 0,
    categoryCounts: 0,
    subCategoryCounts: 0,
    customerCount: 0,
    orderCount: 0,
    totalRevenue: 0
  });

  let revenueByMonth = {
    options: {
      chart: {
        id: "basic-bar",
        toolbar: {
          show: false
        }
      },
      title: {
        text: 'Revenue By Month',
        align: 'left'
      },
      xaxis: {
        categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      }
    },
    series: [
      {
        name: "series-1",
        data: [30000, 40000, 500000, 80000, 490000, 550000, 700000, 910000, 500000, 80000, 490000, 500000]
      }
    ]
  }

  let transactionByMonth = {
    options: {
      series: [{
        name: "Desktops",
        data: [10, 41, 35, 51, 49, 62, 69, 91, 148]
      }],
      chart: {
        type: 'line',
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false,
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'straight'
      },
      title: {
        text: 'Transaction By Month',
        align: 'left'
      },
      grid: {
        row: {
          colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
          opacity: 0.5
        },
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      }
    },
    series: [
      {
        name: "series-1",
        data: [30, 40, 45, 50, 49, 60, 70, 91]
      }
    ]
  }

  let comarisonOfRevenue = {
    series: [{
      name: 'series1',
      data: [31, 40, 28, 51, 42, 109, 100]
    }, {
      name: 'series2',
      data: [11, 32, 45, 32, 34, 52, 41]
    }],
    options: {
      chart: {
        height: 350,
        type: 'area',
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false,
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth'
      },
      title: {
        text: 'Comparison Of Revneues(Offline / Online)',
        align: 'left'
      },
      xaxis: {
        type: 'datetime',
        categories: ["2018-09-19T00:00:00.000Z", "2018-09-19T01:30:00.000Z", "2018-09-19T02:30:00.000Z", "2018-09-19T03:30:00.000Z", "2018-09-19T04:30:00.000Z", "2018-09-19T05:30:00.000Z", "2018-09-19T06:30:00.000Z"]
      },
      tooltip: {
        x: {
          format: 'dd/MM/yy HH:mm'
        },
      }
    }
  }

  let yearWiseRevenue = {
    options: {
      title: {
        text: 'Product Wise Revenue(Yearly)',
        align: 'left'
      },
      labels: ['A', 'B', 'C', 'D', 'E'],
      chart: {
        toolbar: {
          show: false
        }
      },
    },
    series: [44, 55, 41, 17, 15]
  }

  let winterReasonRevenue = {
    options: {
      legend: {
        show: false
      },
      title: {
        text: 'Product Wise Revenue (Winter)',
        align: 'left'
      },
      chart: {
        toolbar: {
          show: false
        }
      },
    },
    series: [44, 55, 41, 17, 15],
    chartOptions: {
      labels: ['Apple', 'Mango', 'Orange', 'Watermelon']
    },
  }

  let rainyReasonRevenue = {
    options: {
      title: {
        text: 'Product Wise Revenue (Rainy)',
        align: 'left'
      },
      legend: {
        show: false
      },
      chart: {
        toolbar: {
          show: false
        }
      }
    },
    series: [44, 55, 41, 17, 15],
    chartOptions: {
      labels: ['Apple', 'Mango', 'Orange', 'Watermelon']
    }
  }

  let summerReasonRevenue = {
    options: {
      title: {
        text: 'Product Wise Revenue (Summer)',
        align: 'left'
      },
      legend: {
        show: false
      },
      chart: {
        toolbar: {
          show: false
        }
      }
    },
    series: [44, 55, 41, 17, 15],
    chartOptions: {
      labels: ['Apple', 'Mango', 'Orange', 'Watermelon']
    }
  }

  const fetchCounts = () => {
    setLoader(true);
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_ADMIN_DASHBOARD_URL}/counts`, "" , "get")
      .then((response) => {
        if (response.status === 200) {
          let obj = {
            productCounts: response?.data?.product_count,
            categoryCounts: response?.data?.category_count,
            subCategoryCounts: response?.data?.sub_category_count,
            customerCount: response?.data?.customer_count,
            orderCount: response?.data?.order_count,
            totalRevenue: response?.data?.total_revenue
          }
          setCounts({...counts, ...obj});
        } 
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err?.response?.data?.errors,
          life: 3000,
        });
        setLoader(false);
      }).finally(()=>{
        setLoader(false);
      });
  };

  useEffect(() => {
      if(isLogin){
        toast.current.show({
          severity: "success",
          summary: t("success"),
          detail: "You have successfully login",
          life: 2000
        });
      };
      navigate(location.pathname, { replace: true }); 
      fetchCounts();
  }, []);

  return (
    <div className="overflow-y-scroll h-[88vh] admin-scrollbar">
      <Toast ref={toast} position="top-right" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4 text-TextPrimaryColor">
  <div className="flex bg-BgSecondaryColor border rounded border-BorderColor p-6">
    <div className="flex gap-5">
      <CategoriesSvg />
      <div>
        <div className="font-bold">{counts?.categoryCounts}+</div>
        <div className="text-[0.8rem]">{t("total_categories")}</div>
      </div>
    </div>
  </div>
  <div className="flex bg-BgSecondaryColor border rounded border-BorderColor p-6">
    <div className="flex gap-5">
      <SubCategoriesSvg />
      <div>
        <div className="font-bold">{counts?.subCategoryCounts}+</div>
        <div className="text-[0.8rem]">{t("total_subcategories")}</div>
      </div>
    </div>
  </div>
  <div className="flex bg-BgSecondaryColor border rounded border-BorderColor p-6">
    <div className="flex gap-5">
      <ProductSvg />
      <div>
        <div className="font-bold">{counts?.productCounts}+</div>
        <div className="text-[0.8rem]">{t("total_products")}</div>
      </div>
    </div>
  </div>
  <div className="flex bg-BgSecondaryColor border rounded border-BorderColor p-6">
    <div className="flex gap-5">
      <CustomersSvg />
      <div>
        <div className="font-bold">{counts?.customerCount}+</div>
        <div className="text-[0.8rem]">{t("total_customers")}</div>
      </div>
    </div>
  </div>
  <div className="flex bg-BgSecondaryColor border rounded border-BorderColor p-6">
    <div className="flex gap-5">
      <OrderSvg />
      <div>
        <div className="font-bold">{counts?.orderCount}+</div>
        <div className="text-[0.8rem]">{t("total_orders")}</div>
      </div>
    </div>
  </div>
  <div className="flex bg-BgSecondaryColor border rounded border-BorderColor p-6">
    <div className="flex gap-5">
      <RevenueSvg />
      <div>
        <div className="font-bold">₹ {counts?.totalRevenue}</div>
        <div className="text-[0.8rem]">{t("total_revenue")}</div>
      </div>
    </div>
  </div>
</div>

      <div className="grid grid-cols-2 gap-4 mt-12">
        <div className="relative flex justify-center p-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <Chart
            options={revenueByMonth.options}
            series={revenueByMonth.series}
            type="bar"
            width="500"
          />

          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-white/70 z-10">
            <span className="text-[1rem] font-semibold text-gray-600">{t("coming_soon")}</span>
          </div>
        </div>
        <div className="relative flex justify-center p-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <Chart 
            options={yearWiseRevenue.options} 
            series={yearWiseRevenue.series} 
            type="donut" 
            width="400" 
          />

          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-white/70 z-10">
            <span className="text-[1rem] font-semibold text-gray-600">{t("coming_soon")}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-12">
        {/* Season Wise Revenue */}
        <div className="relative flex justify-center p-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <Chart 
            options={winterReasonRevenue.options} 
            series={winterReasonRevenue.series} 
            type="donut" 
            width="340" 
          />

          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-white/70 z-10">
            <span className="text-[1rem] font-semibold text-gray-600">{t("coming_soon")}</span>
          </div>
        </div>
        <div className="relative flex justify-center p-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <Chart 
            options={rainyReasonRevenue.options} 
            series={rainyReasonRevenue.series} 
            type="donut" 
            width="340" 
          />

          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-white/70 z-10">
            <span className="text-[1rem] font-semibold text-gray-600">{t("coming_soon")}</span>
          </div>
        </div>
        <div className="relative flex justify-center p-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <Chart 
            options={summerReasonRevenue.options} 
            series={summerReasonRevenue.series} 
            type="donut" 
            width="340" 
          />

          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-white/70 z-10">
            <span className="text-[1rem] font-semibold text-gray-600">{t("coming_soon")}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-16 mb-4">
        <div className="relative flex justify-center p-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <Chart
            options={transactionByMonth.options}
            series={transactionByMonth.series}
            type="line"
            width="500" 
          />

          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-white/70 z-10">
            <span className="text-[1rem] font-semibold text-gray-600">{t("coming_soon")}</span>
          </div>
        </div>
        <div className="relative flex justify-center p-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <Chart
            options={comarisonOfRevenue.options}
            series={comarisonOfRevenue.series}
            type="area"
            width="500" 
          />

          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-white/70 z-10">
            <span className="text-[1rem] font-semibold text-gray-600">{t("coming_soon")}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardStats;