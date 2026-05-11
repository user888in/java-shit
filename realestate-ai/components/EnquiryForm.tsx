"use client";

import { CheckCircle, Mail, MessageSquare, Phone, Send, User } from "lucide-react";
import { useState } from "react";

type Props = {
  listingId: string;
  listingOwnerId: string;
  listingTitle: string;
  defaultEmail?: string;
  defaultName?: string;
};

export default function EnquiryForm({
  listingId,
  listingOwnerId,
  listingTitle,
  defaultEmail = "",
  defaultName = "",
}: Props) {
  const [form, setForm] = useState({
    sender_name: defaultName,
    sender_email: defaultEmail,
    sender_phone: "",
    message: `Hi, I'm interested in "${listingTitle}". Please share more details.`,
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }
  async function handleSubmit(e: React.FormEvent){
    e.preventDefault();
    setError('');
    setLoading(true)
    const res = await fetch(`/api/enquiries`,{
        method: 'POST',
        headers: {"Content-Type": 'application/json'},
        body: JSON.stringify({
            listing_id: listingId,
            listing_owner_id: listingOwnerId,
            ...form
        }),
    })
    const data = res.json();
    if(!res.ok){
        setError(data.error ?? 'Something went wrong');
        setLoading(false)
        return
    }
    setSent(true);
    setLoading(false);
  }
    const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-100 transition-all"
  const labelClass = "text-sm font-medium text-gray-700 block mb-1.5"

  if (sent) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-6 h-6 text-gray-900" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">Enquiry Sent!</h3>
        <p className="text-sm text-gray-500">
          The owner will get back to you at <strong>{form.sender_email}</strong>
        </p>
      </div>
    )
  }
   return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Contact Owner</h3>
          <p className="text-xs text-gray-400">Usually responds within 24 hours</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> Name
              </span>
            </label>
            <input
              type="text"
              value={form.sender_name}
              onChange={e => update('sender_name', e.target.value)}
              placeholder="Your name"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone
              </span>
            </label>
            <input
              type="tel"
              value={form.sender_phone}
              onChange={e => update('sender_phone', e.target.value)}
              placeholder="+91 98765 43210"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email
            </span>
          </label>
          <input
            type="email"
            value={form.sender_email}
            onChange={e => update('sender_email', e.target.value)}
            placeholder="your@email.com"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> Message
            </span>
          </label>
          <textarea
            value={form.message}
            onChange={e => update('message', e.target.value)}
            required
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? 'Sending...' : (
            <><Send className="w-4 h-4" /> Send Enquiry</>
          )}
        </button>
      </form>
    </div>
  )
}
