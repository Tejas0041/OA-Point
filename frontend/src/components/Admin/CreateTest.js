import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../../config/api';
import { 
  Plus, 
  Trash2, 
  Upload, 
  Save, 
  ArrowLeft,
  Clock,
  FileText,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import Footer from '../Common/Footer';

const CreateTest = () => {
  const navigate = useNavigate();
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    enableCamera: true,
    enableFullScreen: true,
    preventCopyPaste: true,
    preventRightClick: true,
    sections: []
  });
  const [loading, setLoading] = useState(false);

  const sectionTypes = [
    'Aptitude',
    'Technical',
    'Coding',
    'Logical Reasoning',
    'English',
    'Domain Specific'
  ];

  const questionTypes = [
    { value: 'single-correct', label: 'Single Correct Answer' },
    { value: 'multi-correct', label: 'Multiple Correct Answers' },
    { value: 'coding', label: 'Coding Problem' }
  ];

  // Calculate total duration from all sections
  const getTotalDuration = () => {
    return testData.sections.reduce((total, section) => total + (section.timeLimit || 0), 0);
  };

  const addSection = () => {
    const newSection = {
      name: 'Aptitude',
      timeLimit: 30,
      numberOfQuestions: 1,
      instructions: '',
      order: testData.sections.length,
      questions: [createNewQuestion()] // Start with one question
    };
    
    setTestData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const updateSection = (sectionIndex, field, value) => {
    setTestData(prev => ({
      ...prev,
      sections: prev.sections.map((section, index) => {
        if (index === sectionIndex) {
          const updatedSection = { ...section, [field]: value };
          
          // If numberOfQuestions changed, adjust questions array
          if (field === 'numberOfQuestions') {
            const currentQuestions = updatedSection.questions.length;
            const targetQuestions = parseInt(value) || 1;
            
            if (targetQuestions > currentQuestions) {
              // Add new questions
              const questionsToAdd = targetQuestions - currentQuestions;
              for (let i = 0; i < questionsToAdd; i++) {
                updatedSection.questions.push(createNewQuestion());
              }
            } else if (targetQuestions < currentQuestions) {
              // Remove excess questions
              updatedSection.questions = updatedSection.questions.slice(0, targetQuestions);
            }
          }
          
          return updatedSection;
        }
        return section;
      })
    }));
  };

  const removeSection = (sectionIndex) => {
    setTestData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, index) => index !== sectionIndex)
    }));
  };

  const createNewQuestion = () => ({
    questionText: '',
    questionImage: '',
    questionType: 'single-correct',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    codingDetails: {
      problemStatement: '',
      inputFormat: '',
      outputFormat: '',
      examples: [{ input: 'Sample Input', output: 'Sample Output', explanation: '' }],
      constraints: '',
      testCases: [{ input: 'Test Input', output: 'Test Output', isHidden: false }],
      timeLimit: 1000,
      memoryLimit: 256
    },
    points: 1
  });

  const addQuestion = (sectionIndex) => {
    setTestData(prev => ({
      ...prev,
      sections: prev.sections.map((section, index) => {
        if (index === sectionIndex) {
          const newQuestions = [...section.questions, createNewQuestion()];
          return { 
            ...section, 
            questions: newQuestions,
            numberOfQuestions: newQuestions.length
          };
        }
        return section;
      })
    }));
  };

  const updateQuestion = (sectionIndex, questionIndex, field, value) => {
    setTestData(prev => ({
      ...prev,
      sections: prev.sections.map((section, sIndex) => 
        sIndex === sectionIndex 
          ? {
              ...section,
              questions: section.questions.map((question, qIndex) =>
                qIndex === questionIndex ? { ...question, [field]: value } : question
              )
            }
          : section
      )
    }));
  };

  const updateQuestionOption = (sectionIndex, questionIndex, optionIndex, field, value) => {
    setTestData(prev => ({
      ...prev,
      sections: prev.sections.map((section, sIndex) => 
        sIndex === sectionIndex 
          ? {
              ...section,
              questions: section.questions.map((question, qIndex) =>
                qIndex === questionIndex 
                  ? {
                      ...question,
                      options: question.options.map((option, oIndex) => {
                        if (oIndex === optionIndex) {
                          // For single-correct questions, uncheck other options when one is checked
                          if (field === 'isCorrect' && value && question.questionType === 'single-correct') {
                            return { ...option, [field]: value };
                          }
                          return { ...option, [field]: value };
                        } else if (field === 'isCorrect' && value && question.questionType === 'single-correct') {
                          // Uncheck other options for single-correct
                          return { ...option, isCorrect: false };
                        }
                        return option;
                      })
                    }
                  : question
              )
            }
          : section
      )
    }));
  };

  const removeQuestion = (sectionIndex, questionIndex) => {
    setTestData(prev => ({
      ...prev,
      sections: prev.sections.map((section, sIndex) => {
        if (sIndex === sectionIndex) {
          const newQuestions = section.questions.filter((_, qIndex) => qIndex !== questionIndex);
          return {
            ...section,
            questions: newQuestions,
            numberOfQuestions: Math.max(1, newQuestions.length) // Minimum 1 question
          };
        }
        return section;
      })
    }));
  };

  const uploadImage = async (file, sectionIndex, questionIndex) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(API_ENDPOINTS.ADMIN_UPLOAD_IMAGE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      updateQuestion(sectionIndex, questionIndex, 'questionImage', response.data.imageUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  const addExample = (sectionIndex, questionIndex) => {
    const question = testData.sections[sectionIndex].questions[questionIndex];
    const newExamples = [...question.codingDetails.examples, { input: 'Sample Input', output: 'Sample Output', explanation: '' }];
    
    updateQuestion(sectionIndex, questionIndex, 'codingDetails', {
      ...question.codingDetails,
      examples: newExamples
    });
  };

  const addTestCase = (sectionIndex, questionIndex) => {
    const question = testData.sections[sectionIndex].questions[questionIndex];
    const newTestCases = [...question.codingDetails.testCases, { input: 'Test Input', output: 'Test Output', isHidden: false }];
    
    updateQuestion(sectionIndex, questionIndex, 'codingDetails', {
      ...question.codingDetails,
      testCases: newTestCases
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (testData.sections.length === 0) {
      toast.error('Please add at least one section');
      return;
    }

    // Validate sections have questions
    for (let section of testData.sections) {
      if (section.questions.length === 0) {
        toast.error(`Section "${section.name}" must have at least one question`);
        return;
      }

      // Validate multiple choice questions have correct answers
      for (let questionIndex = 0; questionIndex < section.questions.length; questionIndex++) {
        const question = section.questions[questionIndex];
        
        if (question.questionType === 'single-correct' || question.questionType === 'multi-correct') {
          const hasCorrectAnswer = question.options && question.options.some(option => option.isCorrect);
          if (!hasCorrectAnswer) {
            toast.error(`Question ${questionIndex + 1} in section "${section.name}" must have at least one correct answer selected.`);
            return;
          }
        }
      }
    }

    setLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.ADMIN_TESTS, testData);
      toast.success('Test created successfully');
      navigate('/admin');
    } catch (error) {
      console.error('Error creating test:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to create test');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin')}
                className="btn-secondary flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <img 
                src="/images/logo_oa_point.webp" 
                alt="OA Point Logo" 
                className="h-8 w-8 object-contain"
                style={{ mixBlendMode: 'multiply' }}
              />
              <h1 className="text-2xl font-bold text-gray-900">
                <span className="text-primary-600">OA Point</span> - Create New Test
              </h1>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Creating...' : 'Create Test'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Test Information */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Test Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Title *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={testData.title}
                  onChange={(e) => setTestData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter test title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Duration
                </label>
                <div className="input-field bg-gray-50 flex items-center">
                  <Clock className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700">
                    {getTotalDuration()} minutes
                    {getTotalDuration() === 0 && (
                      <span className="text-gray-500 ml-2">(Add sections to calculate)</span>
                    )}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically calculated from section time limits
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows="3"
                className="input-field"
                value={testData.description}
                onChange={(e) => setTestData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter test description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  className="input-field"
                  value={testData.startDate}
                  onChange={(e) => setTestData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  className="input-field"
                  value={testData.endDate}
                  onChange={(e) => setTestData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Proctoring Settings */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Proctoring Settings</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={testData.enableCamera}
                    onChange={(e) => setTestData(prev => ({ ...prev, enableCamera: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Enable Camera</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={testData.enableFullScreen}
                    onChange={(e) => setTestData(prev => ({ ...prev, enableFullScreen: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Full Screen</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={testData.preventCopyPaste}
                    onChange={(e) => setTestData(prev => ({ ...prev, preventCopyPaste: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Prevent Copy/Paste</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={testData.preventRightClick}
                    onChange={(e) => setTestData(prev => ({ ...prev, preventRightClick: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Prevent Right Click</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="card">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Test Sections</h2>
              <p className="text-sm text-gray-600 mt-1">
                Create sections with questions. Duration is calculated automatically.
              </p>
            </div>

            {testData.sections.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No sections added yet. Click "Add Section" to get started.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {testData.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Section {sectionIndex + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeSection(sectionIndex)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Section Type
                        </label>
                        <select
                          className="input-field"
                          value={section.name}
                          onChange={(e) => updateSection(sectionIndex, 'name', e.target.value)}
                        >
                          {sectionTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time Limit (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="input-field"
                          value={section.timeLimit}
                          onChange={(e) => updateSection(sectionIndex, 'timeLimit', parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Questions
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="input-field"
                          value={section.numberOfQuestions}
                          onChange={(e) => updateSection(sectionIndex, 'numberOfQuestions', parseInt(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instructions
                      </label>
                      <textarea
                        rows="2"
                        className="input-field"
                        value={section.instructions}
                        onChange={(e) => updateSection(sectionIndex, 'instructions', e.target.value)}
                        placeholder="Enter section instructions"
                      />
                    </div>

                    {/* Questions */}
                    <div className="border-t pt-4">
                      <div className="mb-4">
                        <h4 className="font-medium">Questions ({section.questions.length}/{section.numberOfQuestions})</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Questions are automatically managed based on the "Number of Questions" field above
                        </p>
                      </div>

                      {section.questions.map((question, questionIndex) => (
                        <div key={questionIndex} className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="font-medium">Question {questionIndex + 1}</h5>
                            <button
                              type="button"
                              onClick={() => removeQuestion(sectionIndex, questionIndex)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Question Text *
                              </label>
                              <textarea
                                rows="3"
                                required
                                className="input-field"
                                value={question.questionText}
                                onChange={(e) => updateQuestion(sectionIndex, questionIndex, 'questionText', e.target.value)}
                                placeholder="Enter question text"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Question Type
                                </label>
                                <select
                                  className="input-field"
                                  value={question.questionType}
                                  onChange={(e) => updateQuestion(sectionIndex, questionIndex, 'questionType', e.target.value)}
                                >
                                  {questionTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                  ))}
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Points
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  className="input-field"
                                  value={question.points}
                                  onChange={(e) => updateQuestion(sectionIndex, questionIndex, 'points', parseInt(e.target.value))}
                                />
                              </div>
                            </div>

                            {/* Image Upload */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Question Image (Optional)
                              </label>
                              <div className="flex items-center space-x-4">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    if (e.target.files[0]) {
                                      uploadImage(e.target.files[0], sectionIndex, questionIndex);
                                    }
                                  }}
                                  className="hidden"
                                  id={`image-${sectionIndex}-${questionIndex}`}
                                />
                                <label
                                  htmlFor={`image-${sectionIndex}-${questionIndex}`}
                                  className="btn-secondary flex items-center space-x-2 cursor-pointer"
                                >
                                  <Upload className="h-4 w-4" />
                                  <span>Upload Image</span>
                                </label>
                                {question.questionImage && (
                                  <img
                                    src={question.questionImage}
                                    alt="Question"
                                    className="h-16 w-16 object-cover rounded"
                                  />
                                )}
                              </div>
                            </div>

                            {/* MCQ Options */}
                            {question.questionType !== 'coding' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Answer Options
                                  {question.questionType === 'single-correct' && (
                                    <span className="text-xs text-gray-500 ml-2">(Select only one correct answer)</span>
                                  )}
                                  {question.questionType === 'multi-correct' && (
                                    <span className="text-xs text-gray-500 ml-2">(Select multiple correct answers)</span>
                                  )}
                                </label>
                                <div className="space-y-2">
                                  {question.options.map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex items-center space-x-2">
                                      <input
                                        type={question.questionType === 'single-correct' ? 'radio' : 'checkbox'}
                                        name={question.questionType === 'single-correct' ? `question-${sectionIndex}-${questionIndex}` : undefined}
                                        checked={option.isCorrect}
                                        onChange={(e) => updateQuestionOption(sectionIndex, questionIndex, optionIndex, 'isCorrect', e.target.checked)}
                                        className="rounded"
                                      />
                                      <span className="text-sm font-medium w-8">
                                        {String.fromCharCode(65 + optionIndex)}.
                                      </span>
                                      <input
                                        type="text"
                                        className="input-field flex-1"
                                        value={option.text}
                                        onChange={(e) => updateQuestionOption(sectionIndex, questionIndex, optionIndex, 'text', e.target.value)}
                                        placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                      />
                                    </div>
                                  ))}
                                </div>
                                {/* Validation warning */}
                                {question.questionType !== 'coding' && !question.options.some(opt => opt.isCorrect) && (
                                  <div className="flex items-center space-x-2 mt-2 text-amber-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-sm">Please select at least one correct answer</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Coding Question Details */}
                            {question.questionType === 'coding' && (
                              <div className="space-y-4 border-t pt-4">
                                <h6 className="font-medium">Coding Problem Details</h6>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Input Format
                                    </label>
                                    <textarea
                                      rows="3"
                                      className="input-field"
                                      value={question.codingDetails.inputFormat}
                                      onChange={(e) => updateQuestion(sectionIndex, questionIndex, 'codingDetails', {
                                        ...question.codingDetails,
                                        inputFormat: e.target.value
                                      })}
                                      placeholder="Describe input format"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Output Format
                                    </label>
                                    <textarea
                                      rows="3"
                                      className="input-field"
                                      value={question.codingDetails.outputFormat}
                                      onChange={(e) => updateQuestion(sectionIndex, questionIndex, 'codingDetails', {
                                        ...question.codingDetails,
                                        outputFormat: e.target.value
                                      })}
                                      placeholder="Describe output format"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Constraints
                                  </label>
                                  <textarea
                                    rows="2"
                                    className="input-field"
                                    value={question.codingDetails.constraints}
                                    onChange={(e) => updateQuestion(sectionIndex, questionIndex, 'codingDetails', {
                                      ...question.codingDetails,
                                      constraints: e.target.value
                                    })}
                                    placeholder="Enter constraints"
                                  />
                                </div>

                                {/* Examples */}
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                      Examples
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => addExample(sectionIndex, questionIndex)}
                                      className="text-primary-600 hover:text-primary-800 text-sm"
                                    >
                                      + Add Example
                                    </button>
                                  </div>
                                  
                                  {question.codingDetails.examples.map((example, exampleIndex) => (
                                    <div key={exampleIndex} className="bg-white p-3 rounded border mb-2">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Input
                                          </label>
                                          <textarea
                                            rows="2"
                                            className="input-field text-sm"
                                            value={example.input}
                                            onChange={(e) => {
                                              const newExamples = [...question.codingDetails.examples];
                                              newExamples[exampleIndex].input = e.target.value;
                                              updateQuestion(sectionIndex, questionIndex, 'codingDetails', {
                                                ...question.codingDetails,
                                                examples: newExamples
                                              });
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Output
                                          </label>
                                          <textarea
                                            rows="2"
                                            className="input-field text-sm"
                                            value={example.output}
                                            onChange={(e) => {
                                              const newExamples = [...question.codingDetails.examples];
                                              newExamples[exampleIndex].output = e.target.value;
                                              updateQuestion(sectionIndex, questionIndex, 'codingDetails', {
                                                ...question.codingDetails,
                                                examples: newExamples
                                              });
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <div className="mt-2">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                          Explanation (Optional)
                                        </label>
                                        <input
                                          type="text"
                                          className="input-field text-sm"
                                          value={example.explanation}
                                          onChange={(e) => {
                                            const newExamples = [...question.codingDetails.examples];
                                            newExamples[exampleIndex].explanation = e.target.value;
                                            updateQuestion(sectionIndex, questionIndex, 'codingDetails', {
                                              ...question.codingDetails,
                                              examples: newExamples
                                            });
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Test Cases */}
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                      Test Cases
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => addTestCase(sectionIndex, questionIndex)}
                                      className="text-primary-600 hover:text-primary-800 text-sm"
                                    >
                                      + Add Test Case
                                    </button>
                                  </div>
                                  
                                  {question.codingDetails.testCases.map((testCase, testCaseIndex) => (
                                    <div key={testCaseIndex} className="bg-white p-3 rounded border mb-2">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Input
                                          </label>
                                          <textarea
                                            rows="2"
                                            className="input-field text-sm"
                                            value={testCase.input}
                                            onChange={(e) => {
                                              const newTestCases = [...question.codingDetails.testCases];
                                              newTestCases[testCaseIndex].input = e.target.value;
                                              updateQuestion(sectionIndex, questionIndex, 'codingDetails', {
                                                ...question.codingDetails,
                                                testCases: newTestCases
                                              });
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Expected Output
                                          </label>
                                          <textarea
                                            rows="2"
                                            className="input-field text-sm"
                                            value={testCase.output}
                                            onChange={(e) => {
                                              const newTestCases = [...question.codingDetails.testCases];
                                              newTestCases[testCaseIndex].output = e.target.value;
                                              updateQuestion(sectionIndex, questionIndex, 'codingDetails', {
                                                ...question.codingDetails,
                                                testCases: newTestCases
                                              });
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <div className="mt-2">
                                        <label className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            checked={testCase.isHidden}
                                            onChange={(e) => {
                                              const newTestCases = [...question.codingDetails.testCases];
                                              newTestCases[testCaseIndex].isHidden = e.target.checked;
                                              updateQuestion(sectionIndex, questionIndex, 'codingDetails', {
                                                ...question.codingDetails,
                                                testCases: newTestCases
                                              });
                                            }}
                                            className="rounded"
                                          />
                                          <span className="text-xs text-gray-600">Hidden Test Case</span>
                                        </label>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Add Question Button - At bottom of each section */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => addQuestion(sectionIndex)}
                          className="btn-secondary flex items-center space-x-2 mx-auto"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Question</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add Section Button - Always at bottom */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={addSection}
                className="btn-primary flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Add Section</span>
              </button>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default CreateTest;