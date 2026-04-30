import { Chips } from 'primereact/chips';

const Chips = ({value}) => {
  return (
        <Chips 
            value={value} 
            onChange={(e) => setValue(e.value)} 
        />
  )
}

export default Chips;