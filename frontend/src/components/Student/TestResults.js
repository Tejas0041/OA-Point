import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { formatDateTime } from '../../utils/dateUtils';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Award,
  FileText,
  Target,
  TrendingUp
} from 'lucide-react';

const TestResults = () => {
  const { id: testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTestResults = useCallback(async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.STUDENT_TEST_RESULTS(testId));
      setTest(response.data.test);
      setAttempt(response.data.attempt);
    } catch (error) {
      console.error('Error fetching test results:', error);
      setError('Failed to load test results');
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchTestResults();
  }, [fetchTestResults]);



  const getAnswerForQuestion = (questionId) => {
    if (!attempt || !attempt.sectionAttempts) return null;
    
    for (const sectionAttempt of attempt.sectionAttempts) {
      const answer = sectionAttempt.answers.find(a => a.questionId === questionId);
      if (answer) return answer;
    }
    return null;
  };

  const isAnswerCorrect = (question, userAnswer) => {
    if (!userAnswer) return false;
    
    if (question.questionType === 'single-correct') {
      // Find the correct option index
      const correctOptionIndex = question.options.findIndex(option => option.isCorrect);
      return userAnswer.selectedOptions && 
             userAnswer.selectedOptions.length === 1 && 
             userAnswer.selectedOptions[0] === correctOptionIndex;
    } else if (question.questionType === 'multi-correct') {
      // Find all correct option indices
      const correctOptionIndices = question.options
        .map((option, index) => option.isCorrect ? index : -1)
        .filter(index => index !== -1);
      if (!userAnswer.selectedOptions || correctOptionIndices.length === 0) return false;
      const userSet = new Set(userAnswer.selectedOptions);
      const correctSet = new Set(correctOptionIndices);
      return userSet.size === correctSet.size && 
             [...userSet].every(x => correctSet.has(x));
    } else if (question.questionType === 'coding') {
      return userAnswer.testCaseResults && 
             userAnswer.testCaseResults.every(result => result.passed);
    }
    return false;
  };

  const getPartialScore = (question, userAnswer) => {
    if (!userAnswer || question.questionType !== 'coding') return 0;
    
    if (userAnswer.testCaseResults && userAnswer.testCaseResults.length > 0) {
      const passedCount = userAnswer.testCaseResults.filter(result => result.passed).length;
      const totalTestCases = userAnswer.testCaseResults.length;
      return (passedCount / totalTestCases) * (question.points || 1);
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Results</h3>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="mt-4 btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions = test.sections.reduce((total, section) => total + section.questions.length, 0);
  const correctAnswers = test.sections.reduce((total, section) => {
    return total + section.questions.filter(question => {
      const userAnswer = getAnswerForQuestion(question._id);
      return isAnswerCorrect(question, userAnswer);
    }).length;
  }, 0);

  // Calculate total possible points and earned points
  const totalPoints = test.sections.reduce((total, section) => {
    return total + section.questions.reduce((sectionTotal, question) => {
      return sectionTotal + (question.points || 1);
    }, 0);
  }, 0);

  const earnedPoints = test.sections.reduce((total, section) => {
    return total + section.questions.reduce((sectionTotal, question) => {
      const userAnswer = getAnswerForQuestion(question._id);
      if (isAnswerCorrect(question, userAnswer)) {
        return sectionTotal + (question.points || 1);
      } else if (question.questionType === 'coding') {
        return sectionTotal + getPartialScore(question, userAnswer);
      }
      return sectionTotal;
    }, 0);
  }, 0);

  // Calculate partial answers (for coding questions)
  const partialAnswers = test.sections.reduce((total, section) => {
    return total + section.questions.filter(question => {
      const userAnswer = getAnswerForQuestion(question._id);
      return question.questionType === 'coding' && 
             userAnswer?.testCaseResults && 
             !isAnswerCorrect(question, userAnswer) &&
             userAnswer.testCaseResults.some(result => result.passed);
    }).length;
  }, 0);

  // Calculate unattempted questions
  const unattemptedAnswers = test.sections.reduce((total, section) => {
    return total + section.questions.filter(question => {
      const userAnswer = getAnswerForQuestion(question._id);
      if (!userAnswer) return true; // No answer at all
      
      if (question.questionType === 'coding') {
        return !userAnswer.code || userAnswer.code.trim() === '';
      } else {
        return !userAnswer.selectedOptions || userAnswer.selectedOptions.length === 0;
      }
    }).length;
  }, 0);

  // Calculate incorrect answers (attempted but wrong)
  const incorrectAnswers = test.sections.reduce((total, section) => {
    return total + section.questions.filter(question => {
      const userAnswer = getAnswerForQuestion(question._id);
      if (!userAnswer) return false; // Not attempted, so not incorrect
      
      // Check if it was attempted
      let wasAttempted = false;
      if (question.questionType === 'coding') {
        wasAttempted = userAnswer.code && userAnswer.code.trim() !== '';
      } else {
        wasAttempted = userAnswer.selectedOptions && userAnswer.selectedOptions.length > 0;
      }
      
      // If attempted but not correct and not partial
      return wasAttempted && 
             !isAnswerCorrect(question, userAnswer) && 
             !(question.questionType === 'coding' && 
               userAnswer?.testCaseResults && 
               userAnswer.testCaseResults.some(result => result.passed));
    }).length;
  }, 0);

  // Use the calculated percentage from the attempt if available, otherwise calculate it
  const percentage = attempt?.percentage || (totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0);

  // Calculate time spent
  const calculateTimeSpent = () => {
    if (!attempt?.startTime || !attempt?.endTime) return 'N/A';
    
    const startTime = new Date(attempt.startTime);
    const endTime = new Date(attempt.endTime);
    const timeSpentMs = endTime - startTime;
    const timeSpentMinutes = Math.floor(timeSpentMs / (1000 * 60));
    const timeSpentSeconds = Math.floor((timeSpentMs % (1000 * 60)) / 1000);
    
    if (timeSpentMinutes >= 60) {
      const hours = Math.floor(timeSpentMinutes / 60);
      const minutes = timeSpentMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
    
    return timeSpentSeconds > 0 ? `${timeSpentMinutes}m ${timeSpentSeconds}s` : `${timeSpentMinutes}m`;
  };

  const timeSpent = calculateTimeSpent();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/student/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <img 
                  src="/images/logo_oa_point.webp" 
                  alt="OA Point Logo" 
                  className="h-10 w-10 object-contain"
                  style={{ mixBlendMode: 'multiply' }}
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    <span className="text-primary-600">OA Point</span> Results
                  </h1>
                  <p className="text-gray-600">{test.title}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Assessment Platform</div>
              <div className="text-xs text-gray-400">
                Need help? <a href="mailto:onlineassessment.point@gmail.com" className="text-primary-600 hover:text-primary-800">Contact Support</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{Math.round(percentage)}%</div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{earnedPoints.toFixed(1)}/{totalPoints}</div>
              <div className="text-sm text-gray-600">Points Earned</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{correctAnswers}</div>
              <div className="text-sm text-gray-600">Fully Correct</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-2">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{partialAnswers}</div>
              <div className="text-sm text-gray-600">Partial Correct</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-2">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{incorrectAnswers}</div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mx-auto mb-2">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-gray-900">{unattemptedAnswers}</div>
              <div className="text-sm text-gray-600">Unattempted</div>
            </div>

          </div>
        </div>

        {/* Test Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Test Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Submitted:</span>
              <span className="ml-2 text-gray-900">
                {attempt.endTime ? formatDateTime(attempt.endTime) : 'Not submitted'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Time Spent:</span>
              <span className="ml-2 text-gray-900">{timeSpent}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Duration Allowed:</span>
              <span className="ml-2 text-gray-900">{test.duration} minutes</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Total Questions:</span>
              <span className="ml-2 text-gray-900">{totalQuestions}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Sections:</span>
              <span className="ml-2 text-gray-900">{test.sections.length}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Violations:</span>
              <span className="ml-2 text-gray-900">{attempt.violations?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Section-wise Performance */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Section-wise Performance</h3>
          <div className="space-y-4">
            {test.sections.map((section, sectionIndex) => {
              const sectionQuestions = section.questions;
              const sectionCorrect = sectionQuestions.filter(question => {
                const userAnswer = getAnswerForQuestion(question._id);
                return isAnswerCorrect(question, userAnswer);
              }).length;
              
              const sectionTotalPoints = sectionQuestions.reduce((total, question) => total + (question.points || 1), 0);
              const sectionEarnedPoints = sectionQuestions.reduce((total, question) => {
                const userAnswer = getAnswerForQuestion(question._id);
                if (isAnswerCorrect(question, userAnswer)) {
                  return total + (question.points || 1);
                } else if (question.questionType === 'coding') {
                  return total + getPartialScore(question, userAnswer);
                }
                return total;
              }, 0);
              
              const sectionPercentage = sectionTotalPoints > 0 ? Math.round((sectionEarnedPoints / sectionTotalPoints) * 100) : 0;
              
              return (
                <div key={section._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{section.name}</h4>
                    <p className="text-sm text-gray-600">
                      {sectionCorrect}/{sectionQuestions.length} questions correct • {sectionEarnedPoints.toFixed(1)}/{sectionTotalPoints} points
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      sectionPercentage >= 80 ? 'text-green-600' :
                      sectionPercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {sectionPercentage}%
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full ${
                          sectionPercentage >= 80 ? 'bg-green-500' :
                          sectionPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${sectionPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Questions Review */}
        <div className="space-y-6">
          {test.sections.map((section, sectionIndex) => (
            <div key={section._id} className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Section {sectionIndex + 1}: {section.name}
                </h3>
              </div>
              <div className="p-6 space-y-6">
                {section.questions.map((question, questionIndex) => {
                  const userAnswer = getAnswerForQuestion(question._id);
                  const isCorrect = isAnswerCorrect(question, userAnswer);
                  
                  // Debug logging for answer checking
                  if (process.env.NODE_ENV === 'development') {
                    console.log(`Question ${questionIndex + 1}:`, {
                      questionId: question._id,
                      userAnswer,
                      isCorrect,
                      correctOptions: question.options.map((opt, idx) => ({ index: idx, text: opt.text, isCorrect: opt.isCorrect }))
                    });
                  }

                  return (
                    <div key={question._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">
                              Question {questionIndex + 1}
                            </span>
                            {isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span className={`text-xs px-2 py-1 rounded ${
                              isCorrect ? 'bg-green-100 text-green-800' : 
                              question.questionType === 'coding' && userAnswer?.testCaseResults ? 'bg-yellow-100 text-yellow-800' : 
                              (() => {
                                // Check if question was attempted
                                if (!userAnswer) return 'bg-gray-100 text-gray-800';
                                
                                let wasAttempted = false;
                                if (question.questionType === 'coding') {
                                  wasAttempted = userAnswer.code && userAnswer.code.trim() !== '';
                                } else {
                                  wasAttempted = userAnswer.selectedOptions && userAnswer.selectedOptions.length > 0;
                                }
                                
                                return wasAttempted ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';
                              })()
                            }`}>
                              {question.questionType === 'coding' && userAnswer?.testCaseResults ? (
                                (() => {
                                  const passedCount = userAnswer.testCaseResults.filter(r => r.passed).length;
                                  const totalCount = userAnswer.testCaseResults.length;
                                  const partialScore = getPartialScore(question, userAnswer);
                                  const maxScore = question.points || 1;
                                  return `${partialScore.toFixed(1)}/${maxScore} pts (${passedCount}/${totalCount} passed)`;
                                })()
                              ) : (() => {
                                if (!userAnswer) return `0/${question.points || 1} pts - Unattempted`;
                                
                                let wasAttempted = false;
                                if (question.questionType === 'coding') {
                                  wasAttempted = userAnswer.code && userAnswer.code.trim() !== '';
                                } else {
                                  wasAttempted = userAnswer.selectedOptions && userAnswer.selectedOptions.length > 0;
                                }
                                
                                if (!wasAttempted) return `0/${question.points || 1} pts - Unattempted`;
                                return isCorrect ? `${question.points || 1}/${question.points || 1} pts - Correct` : `0/${question.points || 1} pts - Incorrect`;
                              })()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {question.questionType === 'single-correct' ? 'Single Choice' :
                             question.questionType === 'multi-correct' ? 'Multiple Choice' :
                             question.questionType === 'coding' ? 'Coding Problem' : 'Question'}
                            {question.points && question.points !== 1 && ` • ${question.points} points`}
                          </div>
                        </div>
                        <h4 className="text-base font-medium text-gray-900 mb-2">
                          {question.questionText}
                        </h4>
                        {question.questionImage && (
                          <img
                            src={question.questionImage}
                            alt="Question"
                            className="max-w-full h-auto max-h-64 object-contain rounded border mb-4"
                          />
                        )}
                      </div>

                      <div className="space-y-4 pt-4 border-t border-gray-200">
                          {question.questionType !== 'coding' ? (
                            <div className="space-y-3">
                              {question.options.map((option, optionIndex) => {
                                const isUserSelected = userAnswer?.selectedOptions?.includes(optionIndex);
                                const isCorrectOption = option.isCorrect;

                                return (
                                  <div
                                    key={optionIndex}
                                    className={`p-3 rounded-lg border ${
                                      isCorrectOption && isUserSelected
                                        ? 'bg-green-50 border-green-200'
                                        : isUserSelected && !isCorrectOption
                                        ? 'bg-red-50 border-red-200'
                                        : isCorrectOption
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        {isCorrectOption && isUserSelected && <CheckCircle className="h-4 w-4 text-green-600" />}
                                        {isUserSelected && !isCorrectOption && <XCircle className="h-4 w-4 text-red-600" />}
                                        {isCorrectOption && !isUserSelected && <CheckCircle className="h-4 w-4 text-blue-600" />}
                                        <span className="text-sm">{option.text}</span>
                                      </div>
                                      <div className="flex items-center space-x-2 text-xs">
                                        {isUserSelected && (
                                          <span className={`px-2 py-1 rounded ${
                                            isCorrectOption ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                          }`}>
                                            Your Answer
                                          </span>
                                        )}
                                        {isCorrectOption && (
                                          <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                                            Correct Answer
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div>
                                <h5 className="font-medium text-gray-700 mb-2">Your Code:</h5>
                                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                                  {userAnswer?.code || 'No code submitted'}
                                </pre>
                              </div>
                              {userAnswer?.testCaseResults && (
                                <div>
                                  <h5 className="font-medium text-gray-700 mb-2">Test Case Results:</h5>
                                  <div className="space-y-2">
                                    {userAnswer.testCaseResults.map((result, index) => (
                                      <div
                                        key={index}
                                        className={`p-3 rounded border ${
                                          result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                        }`}
                                      >
                                        <div className="flex items-center space-x-2 mb-2">
                                          {result.passed ? (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <XCircle className="h-4 w-4 text-red-600" />
                                          )}
                                          <span className="text-sm font-medium">
                                            Test Case {index + 1}
                                          </span>
                                        </div>
                                        <div className="text-xs space-y-1">
                                          <div><strong>Input:</strong> {result.input}</div>
                                          <div><strong>Expected:</strong> {result.expectedOutput}</div>
                                          <div><strong>Your Output:</strong> {result.actualOutput}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestResults;