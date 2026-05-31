import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, MapPin, CheckCircle2 } from 'lucide-react';

export function Reservations() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [partySize, setPartySize] = useState(2);
  const [requests, setRequests] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !email || !phone || !date || !time) {
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 rounded-[2rem] bg-orange-600 p-10 text-white shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-orange-100/80">Table Reservations</p>
              <h1 className="mt-4 text-4xl font-bold">Reserve your table in seconds</h1>
              <p className="mt-4 max-w-2xl text-orange-100/90">Choose your preferred date and time, add your guest count, and we’ll hold the best table for you.</p>
            </div>
            <Link to="/menu" className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20">
              Browse Menu
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] bg-white p-8 shadow-lg">
            {submitted ? (
              <div className="rounded-[2rem] border border-orange-100 bg-orange-50 p-8 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-600 text-white">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-3xl font-semibold text-orange-700">Reservation Confirmed</h2>
                <p className="mt-4 text-gray-600">Thanks, {name}! We have received your reservation request for {partySize} people on {date} at {time}.</p>
                <p className="mt-3 text-sm text-gray-500">We’ll follow up with a confirmation email at {email} and phone message at {phone}.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    Full Name
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-3xl border border-gray-200 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      placeholder="Your name"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    Email Address
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-3xl border border-gray-200 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      placeholder="email@example.com"
                    />
                  </label>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    Phone Number
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-3xl border border-gray-200 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      placeholder="(555) 123-4567"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    Party Size
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={partySize}
                      onChange={(e) => setPartySize(Number(e.target.value))}
                      className="w-full rounded-3xl border border-gray-200 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                    />
                  </label>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    Reservation Date
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-3xl border border-gray-200 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    Reservation Time
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full rounded-3xl border border-gray-200 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                    />
                  </label>
                </div>

                <label className="space-y-2 text-sm font-medium text-gray-700">
                  Special Requests
                  <textarea
                    value={requests}
                    onChange={(e) => setRequests(e.target.value)}
                    className="w-full min-h-[120px] rounded-3xl border border-gray-200 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                    placeholder="Let us know if you need a quiet table, high chair, or celebration setup."
                  />
                </label>

                <button type="submit" className="inline-flex items-center justify-center rounded-3xl bg-orange-600 px-6 py-4 text-white text-base font-semibold shadow-lg hover:bg-orange-700 transition">
                  Request Reservation
                </button>
              </form>
            )}
          </div>

          <aside className="space-y-6 rounded-[2rem] bg-white p-8 shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-3xl bg-orange-50 p-4">
                <Calendar className="h-6 w-6 text-orange-600" />
                <p className="text-sm font-semibold text-orange-700">Need help booking? Call us anytime.</p>
              </div>
              <div className="rounded-3xl border border-gray-200 p-5">
                <p className="text-sm text-gray-500">Location</p>
                <p className="mt-2 font-semibold text-gray-900">123 Main Street, Suite 100</p>
                <p className="text-sm text-gray-500 mt-1">Cityville, CA 90210</p>
              </div>
              <div className="rounded-3xl border border-gray-200 p-5">
                <p className="text-sm text-gray-500">Hours</p>
                <p className="mt-2 text-gray-900">Mon - Thu: 11am - 10pm</p>
                <p className="text-gray-900">Fri - Sat: 11am - 12am</p>
                <p className="text-gray-900">Sun: 12pm - 9pm</p>
              </div>
              <div className="rounded-3xl border border-gray-200 p-5">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  <p className="text-sm text-gray-500">Quick FAQ</p>
                </div>
                <ul className="mt-3 space-y-3 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Walk-ins welcome when available.</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> We accommodate dietary requests.</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Want to order first? Visit our menu.</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
