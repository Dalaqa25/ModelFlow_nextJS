"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/supabase-auth-context';
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import UnifiedCard from '@/app/components/shared/UnifiedCard';

export default function Playground() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState({});
  const [outputs, setOutputs] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const modelId = searchParams.get('modelId');

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please sign in to use the playground");
      router.push('/auth/login');
      return;
    }

    if (!modelId) {
      toast.error("No model specified");
      router.push('/dashboard');
      return;
    }

    fetchTemplateData();
  }, [modelId, isAuthenticated]);

  const fetchTemplateData = async () => {
    try {
      setLoading(true);
      
      // Fetch model data to get template_id
      const modelResponse = await fetch(`/api/models/${modelId}`);
      if (!modelResponse.ok) {
        throw new Error('Failed to fetch model data');
      }
      
      const modelData = await modelResponse.json();
      
      // Check if model has a template_id
      if (!modelData.template_id) {
        toast.error("No template associated with this model");
        router.push('/dashboard');
        return;
      }
      
      // Fetch template data from the templates table
      const templateResponse = await fetch(`/api/templates?id=${modelData.template_id}`);
      
      if (!templateResponse.ok) {
        const errorData = await templateResponse.json();
        throw new Error(errorData.error || "Failed to fetch template data");
      }
      
      const templateData = await templateResponse.json();
      setTemplate(templateData);
      
      // Initialize inputs with default values
      const initialInputs = {};
      if (templateData.schema?.inputs) {
        templateData.schema.inputs.forEach(input => {
          initialInputs[input.name] = '';
        });
      }
      setInputs(initialInputs);
    } catch (error) {
      console.error("Error fetching template data:", error);
      toast.error(error.message || "Failed to fetch template data");
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name, value) => {
    setInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (name, file) => {
    setInputs(prev => ({
      ...prev,
      [name]: file
    }));
  };

  const renderInput = (input) => {
    switch (input.type) {
      case 'image':
      case 'file':
        return (
          <div key={input.name} className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {input.label || input.name}
            </label>
            <input
              type="file"
              onChange={(e) => handleFileUpload(input.name, e.target.files[0])}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-purple-600 file:text-white
                hover:file:bg-purple-700
                focus:outline-none"
            />
          </div>
        );
      
      case 'text':
        return (
          <div key={input.name} className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {input.label || input.name}
            </label>
            <input
              type="text"
              value={inputs[input.name] || ''}
              onChange={(e) => handleInputChange(input.name, e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              placeholder={input.placeholder || ''}
            />
          </div>
        );
      
      case 'slider':
        return (
          <div key={input.name} className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {input.label || input.name}: {inputs[input.name] || input.min || 0}
            </label>
            <input
              type="range"
              min={input.min || 0}
              max={input.max || 100}
              step={input.step || 1}
              value={inputs[input.name] || input.min || 0}
              onChange={(e) => handleInputChange(input.name, parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{input.min || 0}</span>
              <span>{input.max || 100}</span>
            </div>
          </div>
        );
      
      case 'number':
        return (
          <div key={input.name} className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {input.label || input.name}
            </label>
            <input
              type="number"
              min={input.min}
              max={input.max}
              step={input.step || 1}
              value={inputs[input.name] || 0}
              onChange={(e) => handleInputChange(input.name, parseFloat(e.target.value))}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // In a real implementation, you would send the inputs to your model API
      // For now, we'll just simulate a response
      toast.success("Processing inputs...");
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create mock outputs based on template
      if (template?.schema?.outputs) {
        const mockOutputs = {};
        template.schema.outputs.forEach(output => {
          switch (output.type) {
            case 'label':
              mockOutputs[output.name] = "Sample Label";
              break;
            case 'confidence':
              mockOutputs[output.name] = Math.random();
              break;
            case 'text':
              mockOutputs[output.name] = "Sample output text";
              break;
            default:
              mockOutputs[output.name] = "Sample output";
          }
        });
        setOutputs(mockOutputs);
      }
      
      toast.success("Processing complete!");
    } catch (error) {
      console.error("Error processing inputs:", error);
      toast.error("Failed to process inputs");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderOutput = (output) => {
    const value = outputs[output.name];
    
    switch (output.type) {
      case 'confidence':
        return (
          <div key={output.name} className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-300">{output.label || output.name}</span>
              <span className="text-sm font-medium text-purple-400">{(value * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
              <div 
                className="bg-purple-600 h-2.5 rounded-full" 
                style={{ width: `${value * 100}%` }}
              ></div>
            </div>
          </div>
        );
      
      default:
        return (
          <div key={output.name} className="mb-4">
            <p className="text-sm font-medium text-gray-300">
              {output.label || output.name}: <span className="text-purple-400">{value}</span>
            </p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <AdaptiveBackground variant="content" className="pt-16">
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
          <svg className="animate-spin h-12 w-12 text-purple-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-lg text-white font-semibold">Loading playground...</span>
        </div>
      </AdaptiveBackground>
    );
  }

  if (!template) {
    return (
      <AdaptiveBackground variant="content" className="pt-16">
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
          </svg>
          <span className="text-lg text-red-300 font-semibold">Template not found</span>
        </div>
      </AdaptiveBackground>
    );
  }

  return (
    <AdaptiveBackground variant="content" className="pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Model Playground</h1>
          <p className="text-gray-400">Test and interact with the model using the controls below</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <UnifiedCard variant="content" padding="lg">
            <h2 className="text-xl font-semibold text-white mb-6">Inputs</h2>
            
            <form onSubmit={handleSubmit}>
              {template.schema?.inputs?.map(renderInput)}
              
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  isProcessing
                    ? 'bg-purple-700 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 active:scale-95'
                } text-white shadow-lg`}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  'Run Model'
                )}
              </button>
            </form>
          </UnifiedCard>

          {/* Output Section */}
          <UnifiedCard variant="content" padding="lg">
            <h2 className="text-xl font-semibold text-white mb-6">Outputs</h2>
            
            {outputs ? (
              <div className="space-y-4">
                {template.schema?.outputs?.map(renderOutput)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Run the model to see outputs</p>
              </div>
            )}
          </UnifiedCard>
        </div>
      </div>
    </AdaptiveBackground>
  );
}