import { useNavigate } from "react-router-dom";

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className='w-screen h-[80px] z-5 bg-zinc-200 top-0 drop-shadow-lg flex items-center'
    >
      <div className='px-2 flex justify-between items-center w-full max-w-screen-lg m-auto'>
        <div className='flex items-center justify-start'>
          <h1 className='text-3xl font-bold mr-4 sm:text-4xl cursor-pointer'
            onClick={() => navigate('/')}>gTCC</h1>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

