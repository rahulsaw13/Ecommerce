import { MultiSelect } from 'primereact/multiselect';

const MultiselectComponent = ({value, options, onChange, name, error, touched, display, optionLabel, placeholder, maxSelectedLabels, className}) => {
 
  return (
      <div className='w-full'>
          {placeholder ? (
            <label className="text-[12px] text-TextSecondaryColor ms-[4px] font-[600]">{placeholder}</label>
          ) : null}
          <MultiSelect 
              value={value} 
              onChange={onChange} 
              name={name}
              options={options} 
              optionLabel={optionLabel} 
              placeholder={placeholder} 
              maxSelectedLabels={maxSelectedLabels} 
              className={className}
              display={display}  
          />
            {error && touched ? (
              <p className="text-[0.7rem] text-red-600">{error}</p>
            ) : (
              ""
            )}
      </div>
  )
}

export default MultiselectComponent;