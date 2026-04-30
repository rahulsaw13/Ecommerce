import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@common/Header';
import Footer from '@common/Footer';
import UserLoader from '@userpage-pages/UserLoader';

const DealsPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {loading && <UserLoader />}
      <Header />
      <div className="pt-[160px] md:pt-20 px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Deals & Offers</h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Deal products will be displayed here */}
          </div>
        </div>
      </div>
      <Footer data={[]} />
    </div>
  );
};

export default DealsPage;
