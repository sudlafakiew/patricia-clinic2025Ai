
import React, { useState } from 'react';
import { supabase, resetConfiguration } from '../lib/supabaseClient';
import { Sparkles, Lock, Mail, Loader2, UserPlus, LogIn, RefreshCw } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Test connection first
      const { error: healthError } = await supabase.from('user_roles').select('count').limit(1);
      if (healthError && healthError.code !== 'PGRST116' && healthError.code !== '42P01') {
        // PGRST116 = no rows returned (OK), 42P01 = table doesn't exist (OK for first setup)
        // Other errors might indicate connection issues
        console.warn('Connection test warning:', healthError);
      }

      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          // Provide more specific error messages
          if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid')) {
            throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
          } else if (error.message.includes('Email not confirmed')) {
            throw new Error('กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ ตรวจสอบกล่องจดหมายของคุณ');
          } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
            throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
          } else {
            throw error;
          }
        }
        
        if (data.session) {
          setMessage('เข้าสู่ระบบสำเร็จ! กำลังโหลด...');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes('already registered') || error.message.includes('already exists')) {
            throw new Error('อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบแทน');
          } else if (error.message.includes('password')) {
            throw new Error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
          } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
            throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
          } else {
            throw error;
          }
        }
        
        if (data.user && data.session) {
            // Auto login success (if email confirm is disabled)
             setMessage('สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบ...');
        } else if (data.user && !data.session) {
            // Email confirmation required
            setMessage('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลของท่านเพื่อยืนยันตัวตนก่อนเข้าสู่ระบบ');
            setMode('login'); // Switch back to login view
        }
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/50 backdrop-blur-sm">
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
                <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Patricia Clinic Manager</h1>
            <p className="text-gray-500 text-sm">
              {mode === 'login' ? 'เข้าสู่ระบบจัดการคลินิก' : 'ลงทะเบียนผู้ดูแลระบบใหม่'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล (Email)</label>
            <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                    type="email"
                    required
                    className="w-full pl-10 p-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="doctor@patriciaclinic.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน (Password)</label>
            <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-700" size={20} />
                <input
                    type="password"
                    required
                    className="w-full pl-10 p-3 border bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="••••••••"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            {mode === 'register' && <p className="text-xs text-gray-400 mt-1">รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร</p>}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2 border border-red-100">
                <span className="text-lg">⚠️</span> 
                <div className="flex-1">
                  <p className="font-medium">{error}</p>
                  {error.includes('ยืนยันอีเมล') && (
                    <p className="text-xs mt-1 text-red-500">
                      หากยังไม่ได้รับอีเมล กรุณาตรวจสอบโฟลเดอร์ Spam หรือติดต่อผู้ดูแลระบบ
                    </p>
                  )}
                  {error.includes('เชื่อมต่อ') && (
                    <p className="text-xs mt-1 text-red-500">
                      ตรวจสอบว่า Supabase URL และ API Key ถูกต้องในหน้า Settings
                    </p>
                  )}
                </div>
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2 border border-green-100">
                <span>✅</span> {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-700 text-white rounded-xl hover:bg-gray-800 font-medium shadow-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : mode === 'login' ? (
              <>เข้าสู่ระบบ <LogIn size={18}/></>
            ) : (
              <>สมัครสมาชิก <UserPlus size={18}/></>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
                {mode === 'login' ? 'ยังไม่มีบัญชีผู้ใช้?' : 'มีบัญชีอยู่แล้ว?'}
            </p>
            <button 
                onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setError('');
                    setMessage('');
                }}
                className="text-blue-600 font-semibold hover:underline mt-1 text-sm"
            >
                {mode === 'login' ? 'ลงทะเบียนผู้ใช้งานใหม่' : 'กลับไปหน้าเข้าสู่ระบบ'}
            </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-3">
            <p className="text-xs text-gray-400">Secured by Supabase Authentication</p>
            
            <div className="flex flex-col gap-2 w-full">
              <button 
                  onClick={resetConfiguration}
                  className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition bg-gray-50 px-3 py-1.5 rounded-lg"
                  title="ล้างการตั้งค่าการเชื่อมต่อที่ผิดพลาด"
              >
                  <RefreshCw size={12} />
                  รีเซ็ตการเชื่อมต่อฐานข้อมูล (Reset Connection)
              </button>
              
              <div className="text-xs text-gray-400 text-center space-y-1">
                <p className="font-medium text-gray-500">ปัญหาการเข้าสู่ระบบ?</p>
                <ul className="list-disc list-inside space-y-0.5 text-left max-w-xs mx-auto">
                  <li>ตรวจสอบอีเมล/รหัสผ่าน</li>
                  <li>ยืนยันอีเมล (ถ้าต้องการ)</li>
                  <li>ตรวจสอบ Supabase URL/Key</li>
                  <li>ปิด Email Confirmation ใน Supabase Dashboard</li>
                </ul>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
