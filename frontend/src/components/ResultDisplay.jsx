import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

function SummarySection({ summary, topic }) {
  if (!summary?.length) {
    return null;
  }

  // Create Wikipedia URL from topic
  const getWikipediaUrl = (topicName) => {
    const encodedTopic = encodeURIComponent(topicName);
    return `https://en.wikipedia.org/wiki/${encodedTopic}`;
  };

  return (
    <section className="card">
      <div className="section-header">
        <h2>Summary</h2>
        {topic && (
          <a
            href={getWikipediaUrl(topic)}
            target="_blank"
            rel="noopener noreferrer"
            className="wikipedia-link"
            title={`Read more about ${topic} on Wikipedia`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 19H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5c.55 0 1-.45 1-1s-.45-1-1-1H5c-1.11 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-.55-.45-1-1-1s-1 .45-1 1v5c0 .55-.45 1-1 1zM14 4c0 .55.45 1 1 1h2.59l-9.13 9.13c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L19 6.41V9c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1h-5c-.55 0-1 .45-1 1z" fill="currentColor"/>
            </svg>
            Read on Wikipedia
          </a>
        )}
      </div>
      <ul className="summary-list">
        {summary.map((bullet, index) => (
          <li key={`summary-${index}`}>{bullet}</li>
        ))}
      </ul>
    </section>
  );
}

SummarySection.propTypes = {
  summary: PropTypes.arrayOf(PropTypes.string),
  topic: PropTypes.string,
};

SummarySection.defaultProps = {
  summary: [],
  topic: '',
};

function QuizSection({ quiz }) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState({});

  useEffect(() => {
    setSelectedAnswers({});
    setShowResults({});
  }, [quiz]);

  if (!quiz?.length) {
    return null;
  }

  const handleAnswerSelect = (questionId, choiceIndex, correctIndex) => {
    // Mark this question as answered
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: choiceIndex,
    }));
    
    // Show results immediately
    setShowResults((prev) => ({
      ...prev,
      [questionId]: true,
    }));
  };

  const getChoiceClassName = (questionId, choiceIndex, correctIndex) => {
    const selected = selectedAnswers[questionId];
    const isShowingResults = showResults[questionId];
    
    if (!isShowingResults) {
      return selected === choiceIndex ? 'choice-selected' : '';
    }
    
    // Show results
    if (choiceIndex === correctIndex) {
      return 'choice-correct';
    }
    if (selected === choiceIndex && choiceIndex !== correctIndex) {
      return 'choice-incorrect';
    }
    return '';
  };

  const getScore = () => {
    let correct = 0;
    quiz.forEach((item) => {
      if (selectedAnswers[item.id] === item.answerIndex) {
        correct += 1;
      }
    });
    return { correct, total: quiz.length };
  };

  const allAnswered = quiz.every((item) => selectedAnswers[item.id] !== undefined);
  const score = allAnswered ? getScore() : null;

  return (
    <section className="card">
      <div className="section-header">
        <h2>Quiz</h2>
        {score && (
          <div className="quiz-score">
            Score: {score.correct}/{score.total}
          </div>
        )}
      </div>
      <ol className="quiz-list">
        {quiz.map((item) => {
          const isAnswered = showResults[item.id];
          return (
            <li key={item.id} className="quiz-item">
              <h3>{item.question}</h3>
              <ul className="quiz-choices">
                {item.choices.map((choice, index) => {
                  const isCorrect = index === item.answerIndex;
                  const isSelected = selectedAnswers[item.id] === index;
                  const className = getChoiceClassName(item.id, index, item.answerIndex);
                  
                  return (
                    <li
                      key={`${item.id}-${index}`}
                      className={`quiz-choice ${className}`}
                      onClick={() => !isAnswered && handleAnswerSelect(item.id, index, item.answerIndex)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && !isAnswered) {
                          e.preventDefault();
                          handleAnswerSelect(item.id, index, item.answerIndex);
                        }
                      }}
                    >
                      <span className="choice-index">{String.fromCharCode(65 + index)}.</span>
                      <span className="choice-text">{choice}</span>
                      {isAnswered && isCorrect && (
                        <span className="choice-icon correct-icon">✓</span>
                      )}
                      {isAnswered && isSelected && !isCorrect && (
                        <span className="choice-icon incorrect-icon">✗</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {isAnswered && (
                <div className="quiz-feedback">
                  {selectedAnswers[item.id] === item.answerIndex ? (
                    <span className="feedback-correct">✓ Correct! Well done.</span>
                  ) : (
                    <span className="feedback-incorrect">
                      ✗ Incorrect. The correct answer is <strong>{String.fromCharCode(65 + item.answerIndex)}</strong>.
                    </span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

QuizSection.propTypes = {
  quiz: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      question: PropTypes.string.isRequired,
      choices: PropTypes.arrayOf(PropTypes.string).isRequired,
      answerIndex: PropTypes.number.isRequired,
    }),
  ),
};

QuizSection.defaultProps = {
  quiz: [],
};

function StudyTipSection({ studyTip }) {
  if (!studyTip) {
    return null;
  }

  return (
    <section className="card">
      <h2>Study Tip</h2>
      <p>{studyTip}</p>
    </section>
  );
}

StudyTipSection.propTypes = {
  studyTip: PropTypes.string,
};

StudyTipSection.defaultProps = {
  studyTip: '',
};

function MathQuestionSection({ mathQuestion }) {
  if (!mathQuestion) {
    return null;
  }

  return (
    <section className="card">
      <h2>Math Challenge</h2>
      <p className="math-question"><strong>Question:</strong> {mathQuestion.question}</p>
      <p><strong>Answer:</strong> {mathQuestion.answer}</p>
      <p><strong>Explanation:</strong> {mathQuestion.explanation}</p>
    </section>
  );
}

MathQuestionSection.propTypes = {
  mathQuestion: PropTypes.shape({
    question: PropTypes.string,
    answer: PropTypes.string,
    explanation: PropTypes.string,
  }),
};

MathQuestionSection.defaultProps = {
  mathQuestion: null,
};

export default function ResultDisplay({ result }) {
  if (!result) {
    return null;
  }

  return (
    <div className="results">
      <MathQuestionSection mathQuestion={result.mathQuestion} />
      <SummarySection summary={result.summary} topic={result.topic} />
      <QuizSection quiz={result.quiz} />
      <StudyTipSection studyTip={result.studyTip} />
    </div>
  );
}

ResultDisplay.propTypes = {
  result: PropTypes.shape({
    topic: PropTypes.string,
    summary: PropTypes.arrayOf(PropTypes.string),
    quiz: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        question: PropTypes.string,
        choices: PropTypes.arrayOf(PropTypes.string),
        answerIndex: PropTypes.number,
      }),
    ),
    studyTip: PropTypes.string,
    mathQuestion: PropTypes.shape({
      question: PropTypes.string,
      answer: PropTypes.string,
      explanation: PropTypes.string,
    }),
  }),
};

ResultDisplay.defaultProps = {
  result: null,
};
