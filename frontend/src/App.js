import React, { useState, useEffect } from 'react';
import axios from 'axios';
//update
const API = 'http://localhost:4000';

function App() {
  const [token, setToken] = useState('');
  const [login, setLogin] = useState({ username: '', password: '' });
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [edit, setEdit] = useState({ id: null, text: '' });
  const [error, setError] = useState('');

  useEffect(() => { if (token) fetchItems(); }, [token]);

  const fetchItems = async () => {
    try {
      const res = await axios.get(API + '/items', { headers: { Authorization: 'Bearer ' + token } });
      setItems(res.data);
      // If currently editing, try to keep the edit state if the item still exists
      if (edit.id) {
        const stillExists = res.data.find(i => i.id === edit.id);
        if (!stillExists) setEdit({ id: null, text: '' });
      }
    } catch { setError('Failed to fetch items'); }
  };

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(API + '/login', login);
      setToken(res.data.token);
    } catch { setError('Invalid credentials'); }
  };

  const handleAdd = async e => {
    e.preventDefault();
    if (!newItem.trim()) {
      setError('Cannot add empty item');
      return;
    }
    try {
      await axios.post(API + '/items', { text: newItem }, { headers: { Authorization: 'Bearer ' + token } });
      setNewItem('');
      await fetchItems();
    } catch { setError('Add failed'); }
  };

  const handleEdit = async e => {
    e.preventDefault();
    if (!edit.text.trim()) {
      setError('Cannot save empty item');
      setEdit({ id: null, text: '' }); // Always close the edit form on failed save
      return;
    }
    try {
      await axios.put(API + '/items/' + edit.id, { text: edit.text }, { headers: { Authorization: 'Bearer ' + token } });
      setEdit({ id: null, text: '' });
      await fetchItems();
    } catch { setError('Edit failed'); }
  };

  const handleDelete = async id => {
    try {
      await axios.delete(API + '/items/' + id, { headers: { Authorization: 'Bearer ' + token } });
      if (edit.id === id) setEdit({ id: null, text: '' });
      await fetchItems();
    } catch { setError('Delete failed'); }
  };

  if (!token) return (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>
      <input placeholder="Username" value={login.username} onChange={e => setLogin({ ...login, username: e.target.value })} />
      <input placeholder="Password" type="password" value={login.password} onChange={e => setLogin({ ...login, password: e.target.value })} />
      <button type="submit">Login</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );

  return (
    <div>
      <h2>Items</h2>
      <form onSubmit={handleAdd}>
        <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="New item" />
        <button type="submit">Add</button>
      </form>
      <ul>
        {items.map(i => (
          <li key={i.id}>
            {edit.id === i.id ? (
              <form onSubmit={handleEdit}>
                <input value={edit.text} onChange={e => setEdit({ ...edit, text: e.target.value, id: i.id })} />
                <button type="submit">Save</button>
                <button type="button" onClick={e => { e.preventDefault(); setEdit({ id: null, text: '' }); }}>Cancel</button>
              </form>
            ) : (
              <>
                {i.text}
                <button type="button" onClick={() => setEdit({ id: i.id, text: i.text })}>Edit</button>
                <button onClick={() => handleDelete(i.id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
      <button onClick={() => setToken('')}>Logout</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </div>
  );
}

export default App;
