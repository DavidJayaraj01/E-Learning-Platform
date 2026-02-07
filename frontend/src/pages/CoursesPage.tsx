import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

interface Course {
  id: number
  title: string
  description: string
  instructor_id: number
  level: string
  category: string
  duration: number
  price: number
  thumbnail_url?: string
  created_at: string
}

const CoursesPage: React.FC = () => {
  // Mock data for now - replace with actual API call
  const { data: courses, isLoading, error } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      // Replace with actual API endpoint
      // const response = await fetch('http://localhost:8000/api/courses')
      // return response.json()
      
      // Mock data for development
      return [
        {
          id: 1,
          title: "Introduction to Python Programming",
          description: "Learn the basics of Python programming from scratch. Perfect for beginners.",
          instructor_id: 1,
          level: "beginner",
          category: "programming",
          duration: 40,
          price: 99.99,
          thumbnail_url: "https://via.placeholder.com/300x200",
          created_at: "2024-01-15T10:00:00Z"
        },
        {
          id: 2,
          title: "Advanced React Development",
          description: "Master advanced React concepts including hooks, context, and performance optimization.",
          instructor_id: 2,
          level: "advanced",
          category: "web-development",
          duration: 60,
          price: 149.99,
          thumbnail_url: "https://via.placeholder.com/300x200",
          created_at: "2024-01-20T14:30:00Z"
        },
        {
          id: 3,
          title: "Data Science Fundamentals",
          description: "Explore data analysis, visualization, and machine learning basics with Python.",
          instructor_id: 3,
          level: "intermediate",
          category: "data-science",
          duration: 80,
          price: 199.99,
          thumbnail_url: "https://via.placeholder.com/300x200",
          created_at: "2024-01-25T09:15:00Z"
        }
      ]
    },
  })

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')

  const categories = ['all', 'programming', 'web-development', 'data-science', 'design', 'business']
  const levels = ['all', 'beginner', 'intermediate', 'advanced']

  const filteredCourses = courses?.filter(course => {
    const categoryMatch = selectedCategory === 'all' || course.category === selectedCategory
    const levelMatch = selectedLevel === 'all' || course.level === selectedLevel
    return categoryMatch && levelMatch
  })

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">Loading courses...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-red-600">Error loading courses</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Browse Courses</h1>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {levels.map(level => (
              <option key={level} value={level}>
                {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses?.map(course => (
          <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <img
              src={course.thumbnail_url || 'https://via.placeholder.com/300x200'}
              alt={course.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  course.level === 'beginner' ? 'bg-green-100 text-green-800' :
                  course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                </span>
                <span className="text-lg font-bold text-blue-600">${course.price}</span>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
              <p className="text-gray-600 mb-4 text-sm line-clamp-3">{course.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{course.duration} hours</span>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Enroll Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredCourses?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No courses found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}

export default CoursesPage