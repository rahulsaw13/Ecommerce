import Header from '@common/Header';
import Footer from '@common/Footer';

const SignInLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white md:bg-gradient-to-b md:from-[#FFC107] md:to-[#FFD54F]">
      <Header />
      <div className="pt-[160px] md:pt-20">
        {children}
      </div>
      <Footer data={[]} />
    </div>
  );
};

export default SignInLayout;
