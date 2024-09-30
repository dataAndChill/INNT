import React, { useState, useEffect } from 'react';
import { View, Text, Button, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Audio } from 'expo-av'; // For sound effects
import questions from './questions'; // Importing questions from questions.js
import ConfettiCannon from 'react-native-confetti-cannon'; // For confetti
import * as Progress from 'react-native-progress'; // Progress Bar

const Stack = createNativeStackNavigator();

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.center}>
      <Text>begin quiz 🎉</Text>
      <Button title="Go to Quiz" onPress={() => navigation.navigate('Quiz')} />
    </View>
  );
};

const QuizScreen = ({ navigation }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10); // Timer starts at 10 seconds
  const [progress, setProgress] = useState(1); // Progress bar initially full
  const [answers, setAnswers] = useState([]); // To store user's answers

  const question = questions[currentQuestionIndex];

  useEffect(() => {
    if (timeLeft === 0 && selectedAnswer === null) {
      handleTimeout();
    }

    const timer = timeLeft > 0 && setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1;
        setProgress(newTime / 10); // Update progress bar
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, selectedAnswer]);

  const handleTimeout = async () => {
    setSelectedAnswer(null); // No answer selected
    setCorrectAnswer(question.correctAnswer); // Highlight correct answer
    playHonkingSound(); // Play honking sound for timeout

    // Store the answer (null for timeout) to review later
    setAnswers([...answers, { question: question.question, selectedAnswer: null, correctAnswer: question.correctAnswer }]);

    setTimeout(() => moveToNextQuestion(), 2000); // Wait 2 seconds before moving on
  };

  const handleAnswer = async (answer) => {
    const isCorrect = answer === question.correctAnswer;
    setSelectedAnswer(answer);
    setCorrectAnswer(question.correctAnswer);

    // Calculate unspent time as points
    const unspentPoints = timeLeft;

    if (isCorrect) {
      setScore(score + 1 + unspentPoints); // Add points for a correct answer + unspent time
      setShowConfetti(true);
      playCorrectSound(); // Play correct sound
      setTimeout(() => setShowConfetti(false), 1000); // Confetti disappears after 1 second
    } else {
      playHonkingSound(); // Play honking sound for wrong answers
    }

    // Store the user's answer to review later
    setAnswers([...answers, { question: question.question, selectedAnswer: answer, correctAnswer: question.correctAnswer }]);

    setTimeout(() => moveToNextQuestion(), 2000); // Move to next question after 2 seconds
  };

  const moveToNextQuestion = () => {
    setSelectedAnswer(null);
    setCorrectAnswer(null);
    setTimeLeft(10); // Reset timer for the next question
    setProgress(1); // Reset progress bar

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Navigate to the review screen when the quiz is complete
      navigation.navigate('Review', { answers, score });
    }
  };

  // Playing honking sound when answer is incorrect
  const playHonkingSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('./assets/honk.mp3') // Add your honk sound file to assets folder
    );
    await sound.playAsync();
  };

  // Playing sound when answer is correct
  const playCorrectSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('./assets/correct.mp3') // Add your correct sound file to assets folder
    );
    await sound.playAsync();
  };

  return (
    <View style={styles.center}>
      <Text>{question.question}</Text>

      {/* Progress Bar */}
      <Progress.Bar
        progress={progress}
        width={200}
        height={20}
        color={'green'}
        unfilledColor={'#ddd'}
        borderWidth={1}
        borderRadius={5}
        style={{ marginBottom: 20 }}
      />

      {/* Display question options */}
      {question.options.map((option, index) => {
        const borderColor = selectedAnswer === option
          ? (option === correctAnswer ? 'green' : 'red')
          : (correctAnswer === option ? 'green' : 'transparent');

        return (
          <TouchableOpacity
            key={index}
            style={[styles.optionButton, { borderColor }]}
            onPress={() => handleAnswer(option)}
            disabled={selectedAnswer !== null} // Disable buttons after selection
          >
            <Text>{option}</Text>
          </TouchableOpacity>
        );
      })}
      
      <Text>Score: {score}</Text>

      {/* Confetti when answer is correct */}
      {showConfetti && <ConfettiCannon count={50} origin={{x: 0, y: 0}} />}
    </View>
  );
};

const ReviewScreen = ({ route }) => {
  const { answers, score } = route.params; // Retrieve answers and score from navigation

  return (
    <ScrollView contentContainerStyle={styles.center}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Review Your Answers</Text>
      {answers.map((answerObj, index) => (
        <View key={index} style={{ marginBottom: 20 }}>
          <Text>{index + 1}. {answerObj.question}</Text>
          {questions[index].options.map((option, i) => {
            const borderColor = option === answerObj.correctAnswer
              ? 'green'
              : option === answerObj.selectedAnswer
              ? 'red'
              : 'transparent';
            
            return (
              <View key={i} style={[styles.reviewOption, { borderColor }]}>
                <Text>{option}</Text>
              </View>
            );
          })}
        </View>
      ))}
      <Text style={{ fontSize: 20 }}>Final Score: {score}</Text>
    </ScrollView>
  );
};

const YourApp = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="Review" component={ReviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  optionButton: {
    padding: 10,
    margin: 10,
    borderWidth: 2,
    borderRadius: 5,
  },
  reviewOption: {
    padding: 10,
    margin: 5,
    borderWidth: 2,
    borderRadius: 5,
  },
});

export default YourApp;
