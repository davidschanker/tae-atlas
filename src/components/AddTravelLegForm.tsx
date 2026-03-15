"use client";

import { useState } from "react";

interface Props {
  addTravelLeg: (formData: FormData) => Promise<void>;
}

export default function AddTravelLegForm({ addTravelLeg }: Props) {
  const [type, setType] = useState<"flight" | "drive">("flight");

  return (
    <form action={addTravelLeg} className="space-y-4">
      {/* Type */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="type"
            value="flight"
            checked={type === "flight"}
            onChange={() => setType("flight")}
            className="accent-indigo-600"
          />
          <span className="text-sm font-medium text-gray-700">Flight</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="type"
            value="drive"
            checked={type === "drive"}
            onChange={() => setType("drive")}
            className="accent-indigo-600"
          />
          <span className="text-sm font-medium text-gray-700">Drive</span>
        </label>
      </div>

      {/* Direction */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="direction"
            value="arrival"
            defaultChecked
            className="accent-indigo-600"
          />
          <span className="text-sm font-medium text-gray-700">Arriving</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="direction"
            value="departure"
            className="accent-indigo-600"
          />
          <span className="text-sm font-medium text-gray-700">Departing</span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="leg-origin" className="block text-sm font-medium text-gray-700 mb-1">
            From <span className="text-red-500">*</span>
          </label>
          <input
            id="leg-origin"
            name="origin"
            required
            placeholder={type === "flight" ? "JFK" : "New York, NY"}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="leg-destination" className="block text-sm font-medium text-gray-700 mb-1">
            To <span className="text-red-500">*</span>
          </label>
          <input
            id="leg-destination"
            name="destination"
            required
            placeholder={type === "flight" ? "EDI" : "Edinburgh, UK"}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="leg-departure-date" className="block text-sm font-medium text-gray-700 mb-1">
            Departure date <span className="text-red-500">*</span>
          </label>
          <input
            id="leg-departure-date"
            name="departure_date"
            type="date"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="leg-departure-time" className="block text-sm font-medium text-gray-700 mb-1">
            Departure time <span className="text-red-500">*</span>
          </label>
          <input
            id="leg-departure-time"
            name="departure_time"
            type="time"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="leg-arrival-date" className="block text-sm font-medium text-gray-700 mb-1">
            Arrival date <span className="text-red-500">*</span>
          </label>
          <input
            id="leg-arrival-date"
            name="arrival_date"
            type="date"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="leg-arrival-time" className="block text-sm font-medium text-gray-700 mb-1">
            Arrival time <span className="text-red-500">*</span>
          </label>
          <input
            id="leg-arrival-time"
            name="arrival_time"
            type="time"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {type === "flight" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Airline
            </label>
            <input
              name="airline"
              placeholder="Delta"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Flight number
            </label>
            <input
              name="flight_number"
              placeholder="DL401"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmation
            </label>
            <input
              name="confirmation_number"
              placeholder="ABC123"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <input
          name="notes"
          placeholder="Layover in Reykjavik, etc."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        Add leg
      </button>
    </form>
  );
}
