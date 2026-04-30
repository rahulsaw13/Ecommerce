import { useNavigate } from "react-router-dom";

const Breadcrum = ({ item }) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between text-TextPrimaryColor">
      <div className="text-[1rem] font-[600]">{item?.heading}</div>
      <div className="flex text-xs">
        {item?.routes?.map((element, index) => {
          return (
            <div
              key={index}
              className="flex items-center"
              onClick={() => {
                navigate(`${element?.route}`);
              }}
            >
              <span className="text-[0.9rem]">{element?.label}</span>
              <span>
                {index !== item?.routes?.length - 1 ? (
                  <span className="mx-2">&gt;</span>
                ) : (
                  ""
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Breadcrum;
