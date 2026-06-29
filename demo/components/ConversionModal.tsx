'use client';

import { useState } from 'react';

interface ConversionModalProps {
  userId: string;
  onConvert: (userId: string, property: string) => Promise<void>;
  onClose: () => void;
}

const NEW_PROPERTY_ID = 'property:maple-drive';
const NEW_PROPERTY_LABEL = '789 Maple Drive';

export default function ConversionModal({ userId, onConvert, onClose }: ConversionModalProps) {
  const [step, setStep] = useState<'form' | 'converting' | 'done'>('form');
  const [name, setName] = useState('Maya Chen');
  const [address, setAddress] = useState(NEW_PROPERTY_LABEL);

  const handleConvert = async () => {
    setStep('converting');
    await onConvert(userId, NEW_PROPERTY_ID);
    setStep('done');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {step === 'form' && (
          <>
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">🏠</span>
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Convert to Customer</h2>
                  <p className="text-xs text-gray-500">Soft → Hard customer conversion</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Maya has scheduled a consultation and is ready to convert. Completing this
                will write an FGA tuple granting her <code className="text-blue-600 bg-blue-50 px-1 rounded">homeowner</code> access
                to her new property.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Customer name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Property address</label>
                  <input
                    value={address}
                    disabled
                    className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 font-mono"
                  />
                </div>
              </div>
              <div className="mt-4 bg-gray-900 rounded-lg p-3 font-mono text-xs">
                <p className="text-gray-400 mb-1">// FGA tuple that will be written:</p>
                <p><span className="text-yellow-300">user</span><span className="text-gray-300">:</span> <span className="text-cyan-300">user:{userId}</span></p>
                <p><span className="text-yellow-300">relation</span><span className="text-gray-300">:</span> <span className="text-purple-300">homeowner</span></p>
                <p><span className="text-yellow-300">object</span><span className="text-gray-300">:</span> <span className="text-green-300">{NEW_PROPERTY_ID}</span></p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConvert}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                Convert Customer →
              </button>
            </div>
          </>
        )}

        {step === 'converting' && (
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-semibold text-gray-900">Writing FGA tuple…</p>
            <p className="text-sm text-gray-500 mt-1 font-mono">user:{userId} | homeowner | {NEW_PROPERTY_ID}</p>
          </div>
        )}

        {step === 'done' && (
          <div className="px-6 py-8 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Conversion Complete</h3>
            <p className="text-sm text-gray-600 mb-4">
              {name} is now an <strong>Homeowner</strong> on <strong>{NEW_PROPERTY_LABEL}</strong>.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs font-mono text-green-800 text-left mb-5">
              <p className="text-green-600 mb-1">// Tuple written to FGA store ✓</p>
              <p>user:{userId} | homeowner | {NEW_PROPERTY_ID}</p>
            </div>
            <p className="text-xs text-gray-500">
              Switch back to the main view and select Maya — she now has full homeowner access.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
