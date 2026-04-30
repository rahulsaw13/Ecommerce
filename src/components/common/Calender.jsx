import { Calendar } from 'primereact/calendar';

const Calender = ({date}) => {
  return (
      <Calendar 
          value={date} 
          onChange={(e) => setDate(e.value)} 
      />
  )
}

export default Calender;