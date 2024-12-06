import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
  Share,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { BarChart } from "react-native-chart-kit";

export default function App() {
  const [screen, setScreen] = useState("auth");
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
  });
  const [selectedEvent, setSelectedEvent] = useState(null);

  const mockUsersDefault = [{ email: "test@example.com", password: "12345" }];
  let mockUsers = mockUsersDefault;

  useEffect(() => {
    const loadInitialData = async () => {
      const storedEvents = await AsyncStorage.getItem("events");
      const storedUsers = await AsyncStorage.getItem("users");
      setEvents(storedEvents ? JSON.parse(storedEvents) : []);
      mockUsers = storedUsers ? JSON.parse(storedUsers) : mockUsersDefault;
    };
    loadInitialData();
  }, []);

  const saveEvents = async (updatedEvents) => {
    setEvents(updatedEvents);
    await AsyncStorage.setItem("events", JSON.stringify(updatedEvents));
  };

  const saveUsers = async () => {
    await AsyncStorage.setItem("users", JSON.stringify(mockUsers));
  };

  const handleLogin = () => {
    const foundUser = mockUsers.find(
      (u) => u.email === email && u.password === password
    );
    if (foundUser) {
      setUser(foundUser);
      setScreen("home");
    } else {
      Alert.alert("Error", "Usuario o contraseña incorrectos.");
    }
  };

  const handleRegister = async () => {
    mockUsers.push({ email, password });
    await saveUsers();
    Alert.alert("Éxito", "Usuario registrado. Ahora puedes iniciar sesión.");
  };

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      Alert.alert("Error", "Por favor, completa todos los campos.");
      return;
    }
    const createdEvent = {
      id: Math.random().toString(),
      ...newEvent,
      attendees: [],
      comments: [],
    };
    const updatedEvents = [...events, createdEvent];
    saveEvents(updatedEvents);
    setNewEvent({ title: "", description: "", date: "" });
  };

  const handleUpdateEvent = (eventId) => {
    if (!newEvent.title || !newEvent.date) {
      Alert.alert("Error", "Por favor, completa todos los campos.");
      return;
    }
    const updatedEvents = events.map((event) =>
      event.id === eventId
        ? {
            ...event,
            title: newEvent.title,
            description: newEvent.description,
            date: newEvent.date,
          }
        : event
    );
    saveEvents(updatedEvents);
    setNewEvent({ title: "", description: "", date: "" });
    setScreen("home");
  };

  const handleRSVP = (eventId) => {
    const updatedEvents = events.map((event) =>
      event.id === eventId
        ? { ...event, attendees: [...event.attendees, user.email] }
        : event
    );
    saveEvents(updatedEvents);
    Alert.alert("Éxito", "Asistencia confirmada.");
  };

  const handleAddComment = (eventId, comment) => {
    const updatedEvents = events.map((event) =>
      event.id === eventId
        ? {
            ...event,
            comments: [...event.comments, { user: user.email, text: comment }],
          }
        : event
    );
    saveEvents(updatedEvents);
    Alert.alert("Éxito", "Comentario agregado.");
  };

  const handleShareEvent = async (event) => {
    try {
      const message = `¡Te invito al evento "${event.title}"! 
Descripción: ${event.description}
Fecha: ${event.date}`;
      await Share.share({ message });
    } catch (error) {
      Alert.alert("Error", "Hubo un problema al intentar compartir el evento.");
    }
  };

  const GradientWrapper = ({ children }) => (
    <LinearGradient
      colors={["#6a11cb", "#2575fc"]}
      style={styles.gradientContainer}
    >
      {children}
    </LinearGradient>
  );

  const screenWidth = Dimensions.get("window").width;

  if (screen === "auth") {
    return (
      <GradientWrapper>
        <Text style={styles.header}>Iniciar Sesión o Registrarse</Text>
        <TextInput
          style={styles.input}
          placeholder="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button title="Iniciar Sesión" onPress={handleLogin} />
        <Button title="Registrarse" onPress={handleRegister} />
      </GradientWrapper>
    );
  }

  if (screen === "home") {
    return (
      <GradientWrapper>
        <Text style={styles.header}>Eventos</Text>
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.eventItem}
              onPress={() => {
                setSelectedEvent(item);
                setScreen("eventDetails");
              }}
            >
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text>{item.date}</Text>
            </TouchableOpacity>
          )}
        />
        <Text style={styles.subHeader}>Crear Nuevo Evento</Text>
        <TextInput
          style={styles.input}
          placeholder="Título"
          value={newEvent.title}
          onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Descripción"
          value={newEvent.description}
          onChangeText={(text) =>
            setNewEvent({ ...newEvent, description: text })
          }
        />
        <TextInput
          style={styles.input}
          placeholder="Fecha (YYYY-MM-DD)"
          value={newEvent.date}
          onChangeText={(text) => setNewEvent({ ...newEvent, date: text })}
        />
        <Button title="Crear Evento" onPress={handleCreateEvent} />
        <Button title="Ver Estadísticas" onPress={() => setScreen("stats")} />
      </GradientWrapper>
    );
  }

  if (screen === "eventDetails") {
    return (
      <GradientWrapper>
        <Text style={styles.header}>{selectedEvent.title}</Text>
        <Text>{selectedEvent.description}</Text>
        <Text>{selectedEvent.date}</Text>
        <Text style={styles.subHeader}>Asistentes:</Text>
        <FlatList
          data={selectedEvent.attendees}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => <Text>- {item}</Text>}
        />
        <Button
          title="Confirmar Asistencia"
          onPress={() => handleRSVP(selectedEvent.id)}
        />
        <Text style={styles.subHeader}>Comentarios:</Text>
        <FlatList
          data={selectedEvent.comments}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <Text>
              {item.user}: {item.text}
            </Text>
          )}
        />
        <TextInput
          style={styles.input}
          placeholder="Agregar comentario"
          onSubmitEditing={(e) =>
            handleAddComment(selectedEvent.id, e.nativeEvent.text)
          }
        />
        <Button
          title="Compartir Evento"
          onPress={() => handleShareEvent(selectedEvent)}
        />
        <Button
          title="Actualizar Evento"
          onPress={() => {
            setNewEvent({
              title: selectedEvent.title,
              description: selectedEvent.description,
              date: selectedEvent.date,
            });
            setScreen("updateEvent");
          }}
        />
        <Button title="Regresar" onPress={() => setScreen("home")} />
      </GradientWrapper>
    );
  }

  if (screen === "updateEvent") {
    return (
      <GradientWrapper>
        <Text style={styles.header}>Actualizar Evento</Text>
        <TextInput
          style={styles.input}
          placeholder="Título"
          value={newEvent.title}
          onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Descripción"
          value={newEvent.description}
          onChangeText={(text) =>
            setNewEvent({ ...newEvent, description: text })
          }
        />
        <TextInput
          style={styles.input}
          placeholder="Fecha (YYYY-MM-DD)"
          value={newEvent.date}
          onChangeText={(text) => setNewEvent({ ...newEvent, date: text })}
        />
        <Button
          title="Actualizar Evento"
          onPress={() => handleUpdateEvent(selectedEvent.id)}
        />
        <Button title="Regresar" onPress={() => setScreen("home")} />
      </GradientWrapper>
    );
  }

  if (screen === "stats") {
    const eventNames = events.map((event) => event.title);
    const attendeesCount = events.map((event) => event.attendees.length);
    const commentsCount = events.map((event) => event.comments.length);

    return (
      <GradientWrapper>
        <Text style={styles.header}>Estadísticas de Participación</Text>
        <Text style={styles.subHeader}>Asistentes por Evento</Text>
        <BarChart
          data={{
            labels: eventNames,
            datasets: [{ data: attendeesCount }],
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundGradientFrom: "#6a11cb",
            backgroundGradientTo: "#2575fc",
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          }}
          style={{
            marginVertical: 20,
            borderRadius: 10,
          }}
        />
        <Text style={styles.subHeader}>Comentarios por Evento</Text>
        <BarChart
          data={{
            labels: eventNames,
            datasets: [{ data: commentsCount }],
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundGradientFrom: "#6a11cb",
            backgroundGradientTo: "#2575fc",
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          }}
          style={{
            marginVertical: 20,
            borderRadius: 10,
          }}
        />
        <Button title="Regresar" onPress={() => setScreen("home")} />
      </GradientWrapper>
    );
  }
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  subHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
  },
  eventItem: {
    padding: 15,
    marginVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 5,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
});
