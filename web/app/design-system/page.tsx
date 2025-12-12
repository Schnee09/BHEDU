/**
 * Design System Showcase
 * View at: /design-system
 * 
 * This page displays all the new UI components with the Professional Blue theme
 * for testing and reference purposes.
 */

"use client";

import { useState } from "react";
import { Button, Card, CardHeader, Modal } from "@/components/ui";

export default function DesignSystemPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-2xl shadow-lg shadow-blue-500/30">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-br from-blue-600 to-indigo-700 bg-clip-text text-transparent font-heading mb-4">
            BH-EDU Design System
          </h1>
          <p className="text-xl text-slate-600">Professional Blue Theme for Education Admin</p>
        </div>

        {/* Color Palette */}
        <Card className="p-8">
          <CardHeader title="Color Palette" subtitle="Professional blue theme for admin staff" />
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Primary Blue</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800].map((shade) => (
                  <div key={shade} className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-lg shadow-md bg-blue-${shade} border border-slate-200`} />
                    <span className="text-xs text-slate-600 mt-2">{shade}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Neutral Slate</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800].map((shade) => (
                  <div key={shade} className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-lg shadow-md bg-slate-${shade} border border-slate-200`} />
                    <span className="text-xs text-slate-600 mt-2">{shade}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Typography */}
        <Card className="p-8">
          <CardHeader title="Typography" subtitle="Poppins for headings, Open Sans for body" />
          <div className="space-y-4">
            <h1 className="text-4xl font-heading font-bold text-slate-900">Heading 1 - Poppins Bold</h1>
            <h2 className="text-3xl font-heading font-semibold text-slate-900">Heading 2 - Poppins Semibold</h2>
            <h3 className="text-2xl font-heading font-semibold text-slate-900">Heading 3 - Poppins Semibold</h3>
            <h4 className="text-xl font-heading font-semibold text-slate-900">Heading 4 - Poppins Semibold</h4>
            <p className="text-base text-slate-700">Body text - Open Sans Regular. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <p className="text-sm text-slate-600">Small text - Open Sans Regular. Used for captions and secondary information.</p>
          </div>
        </Card>

        {/* Buttons */}
        <Card className="p-8">
          <CardHeader title="Buttons" subtitle="All button variants with blue theme" />
          <div className="space-y-8">
            
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-4">Primary Actions</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Blue Primary</Button>
                <Button variant="primary" size="lg">Large Button</Button>
                <Button variant="primary" size="sm">Small Button</Button>
                <Button variant="primary" isLoading>Loading...</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-4">Secondary Actions</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary">Gray Secondary</Button>
                <Button variant="success">Green Success</Button>
                <Button variant="danger">Red Danger</Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-4">Subtle Actions</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-4">With Icons</h4>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="primary" 
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  }
                >
                  Add New
                </Button>
                <Button 
                  variant="primary" 
                  rightIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Cards */}
        <Card className="p-8">
          <CardHeader title="Cards" subtitle="Multiple card variants with hover effects" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <Card variant="default" padding="lg">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Default Card</h3>
              <p className="text-slate-600">Standard card with shadow-md</p>
            </Card>

            <Card variant="elevated" padding="lg" hover>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Elevated Card</h3>
              <p className="text-slate-600">Hover me for effect!</p>
            </Card>

            <Card variant="glass" padding="lg">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Glass Card</h3>
              <p className="text-slate-600">Backdrop blur effect</p>
            </Card>

            <Card variant="outlined" padding="lg">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Outlined Card</h3>
              <p className="text-slate-600">Blue border highlight</p>
            </Card>
          </div>
        </Card>

        {/* Form Inputs */}
        <Card className="p-8">
          <CardHeader title="Form Inputs" subtitle="Blue-focused form elements" />
          <div className="max-w-2xl space-y-5">
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Text Input
              </label>
              <input
                type="text"
                className="w-full border-2 border-slate-200 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                placeholder="Enter your text here"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Input
              </label>
              <input
                type="email"
                className="w-full border-2 border-slate-200 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Dropdown
              </label>
              <select className="w-full border-2 border-slate-200 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-900">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Textarea
              </label>
              <textarea
                className="w-full border-2 border-slate-200 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                rows={4}
                placeholder="Enter your message..."
              />
            </div>
          </div>
        </Card>

        {/* Badges */}
        <Card className="p-8">
          <CardHeader title="Badges" subtitle="Role and status indicators" />
          <div className="space-y-6">
            
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Role Badges</h4>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm">
                  Admin
                </span>
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm">
                  Teacher
                </span>
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-sm">
                  Student
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Status Badges</h4>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-300">
                  Success
                </span>
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  Warning
                </span>
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-800 border border-red-300">
                  Error
                </span>
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                  Info
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Modal Demo */}
        <Card className="p-8">
          <CardHeader title="Modal" subtitle="Glass morphism modal with blue accents" />
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Open Modal Demo
          </Button>
        </Card>

        {/* Shadows */}
        <Card className="p-8">
          <CardHeader title="Shadows" subtitle="Elevation hierarchy" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm font-semibold text-slate-900">shadow-sm</p>
              <p className="text-xs text-slate-600 mt-1">Subtle elevation</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
              <p className="text-sm font-semibold text-slate-900">shadow-md</p>
              <p className="text-xs text-slate-600 mt-1">Standard cards</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
              <p className="text-sm font-semibold text-slate-900">shadow-lg</p>
              <p className="text-xs text-slate-600 mt-1">Elevated cards</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-xl border border-blue-100">
              <p className="text-sm font-semibold text-slate-900">shadow-xl</p>
              <p className="text-xs text-slate-600 mt-1">Modals & overlays</p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-slate-600">
            BH-EDU Design System v2.0 • Professional Blue Theme
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Optimized for admin staff and teachers
          </p>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Example Modal"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setShowModal(false)}>
              Confirm
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-700">
            This is an example modal with the new design system. It features:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-600">
            <li>Glass morphism backdrop with blur</li>
            <li>Blue gradient header</li>
            <li>Smooth scale-in animation</li>
            <li>Professional spacing and typography</li>
            <li>Blue accent borders</li>
          </ul>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              ✨ All modals now follow this consistent design pattern
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
