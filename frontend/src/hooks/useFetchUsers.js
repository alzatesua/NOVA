import { useState, useEffect } from 'react';
import { fetchUsers } from '../services/api';
import { useAuth } from './useAuth';

export function useFetchUsers() {
  const auth = useAuth(); 
  const [users, setUsers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchUsers(auth);
        console.log("data", data);
        setUsers(Array.isArray(data.datos) ? data.datos : []);
      } catch (err) {
        if (err.isNotFound) auth.logout();
      }
    })();
  }, []); 

  return users;
}
