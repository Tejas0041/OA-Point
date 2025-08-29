import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { formatDateTime } from '../../utils/dateUtils';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award,
  FileText
} from 'lucide-react';

const TestResults = () => {
  const { id: testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTestResults();
  }, [testId]);

  const fetchTestResults = async () => {
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
  };



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

  // Use the calculated percentage from the attempt if available, otherwise calculate it
  const percentage = attempt?.percentage || (totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0);

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{Math.round(percentage)}%</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{correctAnswers}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-2">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalQuestions - correctAnswers}</div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mx-auto mb-2">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalQuestions}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>

        {/* Test Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Test Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Submitted:</span>
              <span className="ml-2 text-gray-900">
                {attempt.endTime ? formatDateTime(attempt.endTime) : 'Not submitted'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Duration:</span>
              <span className="ml-2 text-gray-900">{test.duration} minutes</span>
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

                  return (
                    <div key={question._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-2">
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
                            'bg-red-100 text-red-800'
                          }`}>
                            {question.questionType === 'coding' && userAnswer?.testCaseResults ? (
                              (() => {
                                const passedCount = userAnswer.testCaseResults.filter(r => r.passed).length;
                                const totalCount = userAnswer.testCaseResults.length;
                                const partialScore = getPartialScore(question, userAnswer);
                                const maxScore = question.points || 1;
                                return `${partialScore.toFixed(1)}/${maxScore} (${passedCount}/${totalCount} passed)`;
                              })()
                            ) : (
                              isCorrect ? 'Correct' : 'Incorrect'
                            )}
                          </span>
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
                                      isCorrectOption
                                        ? 'bg-green-50 border-green-200'
                                        : isUserSelected
                                        ? 'bg-red-50 border-red-200'
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2">
                                      {isCorrectOption && <CheckCircle className="h-4 w-4 text-green-600" />}
                                      {isUserSelected && !isCorrectOption && <XCircle className="h-4 w-4 text-red-600" />}
                                      <span className="text-sm">{option.text}</span>
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