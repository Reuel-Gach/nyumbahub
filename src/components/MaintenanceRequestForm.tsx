"use client";

import React, { useState } from "react";
import { createMaintenanceTicket } from "@/lib/actions/maintenance";

interface MaintenanceRequestFormProps {
  propertyId: string;
}

export default function MaintenanceRequestForm({ propertyId }: MaintenanceRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      await createMaintenanceTicket({
        propertyId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
      });
      
      setSuccess(true);
      setFormData({ title: "", description: "", priority: "medium" }); // Reset form
    } catch (err) {
      console.error(err);
      setError("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <div className="text-3xl mb-2">✅</div>
        <h3 className="text-lg font-bold text-emerald-900 mb-1">Request Submitted</h3>
        <p className="text-emerald-700 text-sm mb-4">Your landlord has been notified of the issue.</p>
        <button 
          onClick={() => setSuccess(false)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <span className="text-lg">🔧</span> Request Maintenance
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Issue Title</label>
          <input
            type="text"
            required
            placeholder="e.g., Leaking kitchen sink"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
          <textarea
            required
            rows={3}
            placeholder="Please provide details about the issue..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Priority Level</label>
          <select
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          >
            <option value="low">Low - Routine repair, no rush</option>
            <option value="medium">Medium - Needs attention soon</option>
            <option value="high">High - Causing significant inconvenience</option>
            <option value="emergency">Emergency - Safety or property damage risk</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2.5 rounded-lg text-sm font-bold text-white transition-colors flex items-center justify-center gap-2
            ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}