import { useTranslation } from "react-i18next";

const FileUpload = ({value="", name, isLabel, onChange, isDoc, isProfile}) => {
  const { t } = useTranslation("msg");

  return (
      <div className="flex flex-col w-full">
          {isLabel && !isProfile ? (
              <label className="text-[12px] text-TextPrimaryColor ms-[4px] font-[600]">{isLabel}</label>
              ) : null}
          {!isDoc &&
            <>
              { value ?
              <div className={isProfile ? "relative flex justify-center" : "relative"}>
                  {isProfile ? <img src={value} alt="" style={{ borderRadius:"50%", maxWidth: "180px", height: "180px", minWidth: "180px"}}/>
                  : <img src={value} alt="" className="w-full h-full object-cover" style={{ borderRadius:"5px", maxWidth: "100%", height: "230px", minWidth: "100%"}}/>}


                  <div className={`absolute top-0 scale-[1.3] ${isProfile ? "ms-[180px]" : "right-[4px]"}`}>
                    <div className="relative">
                          <span className='ri-pencil-line'></span>
                          <input id="dropzone-file" onChange={onChange} type="file" name={name} className="opacity-0 z-10 w-[25px] absolute right-[20%] top-[15%]" />
                    </div>
                  </div>
              </div>
                  : 
              <label className="flex flex-col items-center justify-center w-full h-32 border border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-[0.75rem] text-gray-500 dark:text-gray-400"><span className="font-semibold">{t("click_to_upload")}</span> {t("ordrag_and_drop")}</p>
                      <p className="text-[0.6rem] text-gray-500 dark:text-gray-400">SVG, PNG, WEBP, JPG or GIF (MAX. 800x400px)</p>
                  </div>
                  <input id="dropzone-file" onChange={onChange} type="file" name={name} className="hidden" />
              </label>}
            </>
          }
          {
            isDoc &&
            <>
              { value ?
              <div className="relative flex justify-center">
                  <div className='flex justify-center w-full h-28'>
                    Your file {value?.name} has been uploaded
                  </div>
                  <div className={`absolute top-0 scale-[1.3] right-[4px]`}>
                    <div className="relative h-[200px]">
                          <span className='ri-pencil-line'></span>
                          <input id="dropzone-file" onChange={onChange} type="file" name={name} accept=".xlsx,.xls,.csv" className="opacity-0 z-10 w-[25px] absolute right-[20%] top-[15%]" />
                    </div>
                  </div>
              </div>
                  : 
              <label className="flex flex-col items-center justify-center w-full h-32 border border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">{t("click_to_upload")}</span> {t("ordrag_and_drop")}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">XLSX or CSV format only</p>
                  </div>
                  <input id="dropzone-file" onChange={onChange} type="file" name={name} accept=".xlsx,.xls,.csv" className="hidden" />
              </label>}
            </>
          }
      </div>
  )
}

export default FileUpload