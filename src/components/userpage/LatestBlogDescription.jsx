import { useState, useEffect } from 'react';
import Header from '@common/Header';
import Footer from '@common/Footer';

const LatestBlogDescription = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="pt-[160px] md:pt-20 px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Blog Post</h1>
          <p className="text-gray-600">Blog content will be displayed here.</p>
        </div>
      </div>
      <Footer data={[]} />
    </div>
  );
};

export default LatestBlogDescription;
