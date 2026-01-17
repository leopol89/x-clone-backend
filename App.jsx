import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, ScrollView } from 'react-native';

const API_URL = 'https://x-clone-backend-production-0c69.up.railway.app';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [tweetContent, setTweetContent] = useState('');
  const [tweets, setTweets] = useState([]);

  // ===== LOGIN =====
  const login = async () => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        alert('Login exitoso!');
        fetchTweets();
      } else {
        alert(data.error || 'Error en login');
      }
    } catch (e) {
      console.error(e);
      alert('Error al conectar al servidor');
    }
  };

  // ===== FETCH TWEETS =====
  const fetchTweets = async () => {
    try {
      const res = await fetch(`${API_URL}/tweets`);
      const data = await res.json();
      setTweets(data);
    } catch (e) {
      console.error(e);
    }
  };

  // ===== CREAR TWEET =====
  const createTweet = async () => {
    if (!tweetContent) return alert('Escribe algo primero');
    try {
      const res = await fetch(`${API_URL}/tweets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: tweetContent })
      });
      const data = await res.json();
      setTweetContent('');
      fetchTweets();
    } catch (e) {
      console.error(e);
      alert('Error al crear tweet');
    }
  };

  // ===== DAR LIKE =====
  const likeTweet = async (tweet_id) => {
    try {
      await fetch(`${API_URL}/likes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tweet_id })
      });
      fetchTweets();
    } catch (e) {
      console.error(e);
    }
  };

  // ===== COMENTARIOS =====
  const [commentContent, setCommentContent] = useState({});
  const addComment = async (tweet_id) => {
    if (!commentContent[tweet_id]) return;
    try {
      await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tweet_id,
          content: commentContent[tweet_id]
        })
      });
      setCommentContent({ ...commentContent, [tweet_id]: '' });
      fetchTweets();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) fetchTweets();
  }, [token]);

  return (
    <ScrollView style={{ padding: 20, marginTop: 50 }}>
      {!token ? (
        <View>
          <Text>Login</Text>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={{ borderWidth: 1, marginBottom: 10, padding: 5 }}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ borderWidth: 1, marginBottom: 10, padding: 5 }}
          />
          <Button title="Login" onPress={login} />
        </View>
      ) : (
        <View>
          <Text>Crear Tweet</Text>
          <TextInput
            placeholder="¿Qué estás pensando?"
            value={tweetContent}
            onChangeText={setTweetContent}
            style={{ borderWidth: 1, marginBottom: 10, padding: 5 }}
          />
          <Button title="Tweet" onPress={createTweet} />

          <Text style={{ marginTop: 20, fontWeight: 'bold' }}>Timeline</Text>
          {tweets.map((t) => (
            <View
              key={t.id}
              style={{ borderBottomWidth: 1, borderColor: '#ccc', padding: 10 }}
            >
              <Text style={{ fontWeight: 'bold' }}>@{t.username}</Text>
              <Text>{t.content}</Text>
              <Text>❤️ {t.likes || 0}</Text>

              <Button title="Like" onPress={() => likeTweet(t.id)} />

              <TextInput
                placeholder="Comenta..."
                value={commentContent[t.id] || ''}
                onChangeText={(text) =>
                  setCommentContent({ ...commentContent, [t.id]: text })
                }
                style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
              />
              <Button title="Comentar" onPress={() => addComment(t.id)} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
