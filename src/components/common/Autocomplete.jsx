import { useEffect, useState } from 'react';
import { AutoComplete } from 'primereact/autocomplete';

const AutocompleteComponent = ({
  value,
  name,
  label,
  placeholder,
  data,
  error,
  touched,
  onChange,
  dropdown
}) => {
  const [filteredData, setFilteredData] = useState([]);
  const [selectedValue, setSelectedValue] = useState(null);

  useEffect(() => {
    // Transform data to include display label
    const transformedData = (data || []).map(item => ({
      ...item,
      displayLabel: `${item.name}${item.weight ? ` (${item.weight})` : ''}`
    }));
    setFilteredData(transformedData);
  }, [data]);

  useEffect(() => {
    // Update selected value when value prop changes
    if (!value) {
      setSelectedValue(null);
      return;
    }
    
    // If value already has displayLabel, use it
    if (value.displayLabel) {
      setSelectedValue(value);
      return;
    }
    
    // If value is a string, find matching item by name
    if (typeof value === 'string') {
      const matchedItem = data.find(item => 
        item.name === value
      );
      
      if (matchedItem) {
        setSelectedValue({
          ...matchedItem,
          displayLabel: `${matchedItem.name}${matchedItem.weight ? ` (${matchedItem.weight})` : ''}`
        });
      } else {
        // If no match found, create a simple object with the string value
        setSelectedValue({ name: value, displayLabel: value });
      }
      return;
    }
    
    // Find matching item in data and add displayLabel
    const matchedItem = data.find(item => 
      item.id == value.id || 
      item.id == value || 
      item.value === value.value ||
      item.value === value ||
      item.name === value.name ||
      item.name === value
    );
    
    if (matchedItem) {
      setSelectedValue({
        ...matchedItem,
        displayLabel: `${matchedItem.name}${matchedItem.weight ? ` (${matchedItem.weight})` : ''}`
      });
    } else {
      setSelectedValue(value);
    }
  }, [value, data]);

  const search = (event) => {
    setTimeout(() => {
      let _filteredData = event.query?.trim()
        ? data.filter((item) =>
            item.name.toLowerCase().includes(event.query.toLowerCase())
          )
        : [...data];

      // Transform filtered data to include display label
      const transformedData = _filteredData.map(item => ({
        ...item,
        displayLabel: `${item.name}${item.weight ? ` (${item.weight})` : ''}`
      }));
      setFilteredData(transformedData);
    }, 250);
  };

  return (
    <div className="custom-input-design w-full">
      {label && (
        <label className="text-[12px] text-TextPrimaryColor ms-[4px] font-[600]">
          {label}
        </label>
      )}

      <AutoComplete
        value={selectedValue}
        placeholder={placeholder}
        dropdown={dropdown}
        forceSelection={false}
        className="autocomplete w-full"
        suggestions={filteredData}
        completeMethod={search}
        field="displayLabel"
        itemTemplate={(item) => (
          <div>{item.name} {item.weight ? `(${item.weight})` : ''}</div>
        )}
        onChange={(e) => {
          setSelectedValue(e.value);
          onChange(name, e.value);
        }}
      />

      {error && touched && <p className="text-[0.7rem] text-red-600">{error}</p>}
    </div>
  );
};

export default AutocompleteComponent;
