import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Welcome to Learn Sphere
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Discover thousands of courses, learn from expert instructors, and advance your career
          with our comprehensive online learning platform.
        </p>
      </div>
    </div>
  );
};

export default HomePage;