import { createContext, useState, useEffect, useContext } from 'react';
import { apiRequest } from '../services/api';

export const CategoryContext = createContext();

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const data = await apiRequest('/api/categories');
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <CategoryContext.Provider value={{ categories, categoriesLoading, refreshCategories: fetchCategories }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => useContext(CategoryContext);
