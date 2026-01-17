import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);

  const [tweetContent, setTweetContent] = useState('');
  const [tweets, setTweets] = useState([]);

  const API_URL = 'https://x-clone-backend-production-0c69.up.railway.app';

  // LOGIN
  const loginUser = async () => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password_hash: password
        })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setUser(data);
        fetchTweets(); // cargar tweets al iniciar sesión
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CREAR TWEET
  const postTweet = async () => {
    if (!tweetContent) return;
    try {
      const res = await fetch(`${API_URL}/tweets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          content: tweetContent
        })
      });
      const newTweet = await res.json();
      setTweets([newTweet, ...tweets]);
      setTweetContent('');
    } catch (err) {
      console.error(err);
    }
  };

  // LISTAR TWEETS
  const fetchTweets = async () => {
    try {
      const res = await fetch(`${API_URL}/tweets`);
      const data = await res.json();
      setTweets(data);
    } catch (err) {
      console.error(err);
    }
  };

  // RENDER TWEET ITEM
  const renderItem = ({ item }) => (
    <View style={styles.tweet}>
      <Text style={styles.username}>{item.username}</Text>
      <Text>{item.content}</Text>
      <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={{ padding: 20, flex: 1 }}>
      {!user ? (
        <>
          <Text>Email:</Text>
          <TextInput value={email} onChangeText={setEmail} style={styles.input} />
          <Text>Password:</Text>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
          <Button title="Login" onPress={loginUser} />
        </>
      ) : (
        <>
          <Text>Hola, {user.username}</Text>
          <TextInput
            placeholder="Escribe un tweet..."
            value={tweetContent}
            onChangeText={setTweetContent}
            style={styles.input}
          />
          <Button title="Publicar Tweet" onPress={postTweet} />

          <Text style={{ marginVertical: 10, fontWeight: 'bold' }}>Tweets:</Text>
          <FlatList
            data={tweets}
            keyExtractor={item => item.id}
            renderItem={renderItem}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 5
  },
  tweet: {
    borderBottomWidth: 1,
    paddingVertical: 5
  },
  username: {
    fontWeight: 'bold'
  },
  date: {
    fontSize: 10,
    color: 'gray'
  }
});
