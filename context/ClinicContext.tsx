import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, Service, Appointment, Status, InventoryItem, CourseDefinition, Transaction, TreatmentRecord, CustomerCourse } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { isAdmin } from '../lib/adminUtils';

interface ClinicContextType {
  customers: Customer[];
  services: Service[];
  appointments: Appointment[];
  inventory: InventoryItem[];
  courseDefinitions: CourseDefinition[];
  transactions: Transaction[];
  isLoadingData: boolean;
  dbConnectionError: string | null;
  
  // Appointments
  addAppointment: (apt: Omit<Appointment, 'id'>) => Promise<void>;
  updateAppointmentStatus: (id: string, status: Status) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;

  // Customers
  addCustomer: (customer: Omit<Customer, 'id' | 'history' | 'treatmentHistory' | 'activeCourses'>) => Promise<any>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  // Services
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, data: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;

  // Inventory
  updateStock: (id: string, quantityChange: number) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  
  // Courses
  addCourse: (course: Omit<CourseDefinition, 'id'>) => Promise<void>;
  updateCourse: (id: string, data: Partial<CourseDefinition>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;

  // Operations
  addTreatmentRecord: (customerId: string, record: { treatmentName: string; details: string; doctorName: string; doctorFee?: number; unitsUsed?: number; photos?: File[] }) => Promise<boolean>;
  processSale: (customerId: string, items: { type: 'service' | 'course'; id: string; price: number; quantity: number }[], paymentMethod: Transaction['paymentMethod']) => Promise<void>;
  useCourse: (customerId: string, courseInstanceId: string, unitsToUse: number, treatmentDetails: Omit<TreatmentRecord, 'id' | 'date' | 'unitsUsed'>) => Promise<void>;
  
  refreshData: () => Promise<void>;
  skipLoadingAndContinue: () => void;
  updateTransaction: (transactionId: string, items: { name: string; price: number; quantity: number }[]) => Promise<boolean>;
  seedDatabase: () => Promise<void>;
  exportToSQL: () => Promise<string>;
  resetDatabase: () => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [courseDefinitions, setCourseDefinitions] = useState<CourseDefinition[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dbConnectionError, setDbConnectionError] = useState<string | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  const refreshData = async () => {
    if (!user) {
      console.log("⏸️ refreshData skipped - no user");
      return;
    }
    setIsLoadingData(true);
    setDbConnectionError(null);
    console.log("📊 Starting data fetch...");
    
    try {
      // Fetch parallel with individual timeouts
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Data fetch timeout')), 12000)
      );

      // Fetch parallel
      const fetchPromise = Promise.all([
        supabase.from('customers').select('*').order('name'),
        supabase.from('services').select('*').order('name'),
        supabase.from('appointments').select('*').order('date', { ascending: false }),
        supabase.from('inventory').select('*').order('name'),
        supabase.from('courses').select('*').order('name'),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('customer_courses').select('*'),
        supabase.from('treatment_records').select('*').order('date', { ascending: false })
      ]);

      const [custRes, servRes, apptRes, invRes, courseRes, transRes, custCourseRes, treatRes] = await Promise.race([fetchPromise, timeoutPromise]) as any;

      console.log("✅ Data fetched successfully");

      // Check for "relation does not exist" error (Code 42P01)
      const errors = [custRes.error, servRes.error, apptRes.error, invRes.error];
      const tableMissingError = errors.find(e => e?.code === '42P01');
      if (tableMissingError) {
          console.error("🚫 Database Tables Missing:", tableMissingError);
          setDbConnectionError('MISSING_TABLES');
          return;
      }

      // Check for network or other critical errors
      const criticalErrors = [custRes.error, servRes.error, apptRes.error, invRes.error, courseRes.error, transRes.error]
        .filter(e => e && !e.code?.startsWith('42'));
      
      if (criticalErrors.length > 0) {
        console.warn("⚠️ Non-permission errors encountered:", criticalErrors);
      }

      // Check for RLS policy errors (Code 42501)
      const rlsErrors = [custRes.error, servRes.error, apptRes.error, invRes.error, courseRes.error, transRes.error];
      const rlsError = rlsErrors.find(e => e?.code === '42501' || e?.message?.includes('permission denied') || e?.message?.includes('row-level security'));
      if (rlsError && !isUserAdmin) {
          console.error("🔐 RLS Policy Error:", rlsError);
      }

      // Map relational data for Customers
      const rawCustomers = custRes.data || [];
      const rawCustCourses = custCourseRes.data || [];
      const rawTreatments = treatRes.data || [];

      const enrichedCustomers = rawCustomers.map((c: any) => ({
        ...c,
        birthDate: c.birth_date,
        lineId: c.line_id,
        activeCourses: rawCustCourses.filter((cc: any) => cc.customer_id === c.id).map((cc: any) => ({
             id: cc.id,
             courseId: cc.course_id,
             courseName: cc.course_name,
             totalUnits: cc.total_units,
             remainingUnits: cc.remaining_units,
             purchaseDate: cc.purchase_date,
             expiryDate: cc.expiry_date,
             active: cc.active
        })),
         treatmentHistory: rawTreatments.filter((t: any) => t.customer_id === c.id).map((t: any) => ({
           id: t.id,
           date: t.date,
           treatmentName: t.treatment_name,
           details: t.details,
           doctorName: t.doctor_name,
           unitsUsed: t.units_used,
           doctorFee: t.doctor_fee,
           photos: t.photos || []
         })),
        history: []
      }));

      setCustomers(enrichedCustomers);
      setServices(servRes.data?.map((s:any) => ({
        ...s, 
        durationMinutes: s.duration_minutes,
        imageUrl: s.image_url
      })) || []);
      setAppointments(apptRes.data?.map((a:any) => ({...a, customerId: a.customer_id, serviceId: a.service_id, doctorName: a.doctor_name})) || []);
      setInventory(invRes.data?.map((i:any) => ({...i, minLevel: i.min_level, pricePerUnit: i.price_per_unit})) || []);
      setCourseDefinitions(courseRes.data?.map((c:any) => ({...c, totalUnits: c.total_units})) || []);
      setTransactions(transRes.data?.map((t:any) => ({...t, date: t.created_at, customerId: t.customer_id, totalAmount: t.total_amount, paymentMethod: t.payment_method})) || []);

      console.log("💾 Data state updated");

    } catch (error: any) {
      console.error("❌ Error fetching data:", error.message);
      if (error?.message?.includes('relation') || error?.code === '42P01' || error?.message?.includes('timeout')) {
          setDbConnectionError('MISSING_TABLES');
      }
    } finally {
      console.log("✅ Data loading complete");
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
        console.log("👤 User authenticated:", user.email);
        // Check admin status (silently handle errors)
        isAdmin(user).then(admin => {
          console.log("👑 Admin status:", admin);
          setIsUserAdmin(admin);
        }).catch((err) => {
          console.warn("⚠️ Could not check admin status:", err);
          setIsUserAdmin(false);
        });
        console.log("🔄 Starting data refresh...");
        refreshData();
    } else {
        console.log("❌ No user, clearing admin status");
        setIsUserAdmin(false);
    }
  }, [user]);

  const skipLoadingAndContinue = () => {
    // Force stop loading and allow dashboard to render
    console.warn("User skipped waiting for data loading");
    setIsLoadingData(false);
  };

  const seedDatabase = async () => {
    // Disabled - Use real database instead of sample data
    // This function is kept for backward compatibility but should not be used
    alert('ฟังก์ชันนี้ถูกปิดใช้งานแล้ว กรุณาใช้ข้อมูลจริงจากฐานข้อมูล');
    return;
  };

  const exportToSQL = async (): Promise<string> => {
      let sql = `-- Patricia Clinic Backup \n-- Date: ${new Date().toISOString()}\n\n`;
      
      // Customers
      if (customers.length > 0) {
          sql += `-- Customers \nINSERT INTO customers (id, name, phone, email, birth_date, notes, address) VALUES \n`;
          sql += customers.map(c => `('${c.id}', '${c.name}', '${c.phone}', '${c.email || ''}', ${c.birthDate ? `'${c.birthDate}'` : 'NULL'}, '${c.notes || ''}', '${c.address || ''}')`).join(',\n') + ';\n\n';
      }

      // Inventory
      if (inventory.length > 0) {
          sql += `-- Inventory \nINSERT INTO inventory (id, name, quantity, unit, min_level, price_per_unit) VALUES \n`;
          sql += inventory.map(i => `('${i.id}', '${i.name}', ${i.quantity}, '${i.unit}', ${i.minLevel}, ${i.pricePerUnit})`).join(',\n') + ';\n\n';
      }

      // Services
      if (services.length > 0) {
          sql += `-- Services \nINSERT INTO services (id, name, price, duration_minutes, category) VALUES \n`;
          sql += services.map(s => `('${s.id}', '${s.name}', ${s.price}, ${s.durationMinutes}, '${s.category}')`).join(',\n') + ';\n\n';
      }
      
      // Courses
      if (courseDefinitions.length > 0) {
           sql += `-- Courses \nINSERT INTO courses (id, name, price, total_units, description) VALUES \n`;
           sql += courseDefinitions.map(c => `('${c.id}', '${c.name}', ${c.price}, ${c.totalUnits}, '${c.description || ''}')`).join(',\n') + ';\n\n';
      }

      return sql;
  };

  const resetDatabase = async () => {
    if (!isUserAdmin) {
      alert('คุณไม่มีสิทธิ์ในการลบข้อมูล กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }
      if (!window.confirm('คำเตือน: การกระทำนี้จะลบข้อมูลในตาราง Inventory, Services, Courses, Customers ทั้งหมด! ยืนยันหรือไม่?')) return;
      setIsLoadingData(true);
      try {
          await supabase.from('treatment_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('customer_courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('appointments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await refreshData();
      } catch (e) {
          console.error(e);
          alert('เกิดข้อผิดพลาดในการล้างข้อมูล: ' + (e as Error).message);
      } finally {
          setIsLoadingData(false);
      }
  };

  // --- Operations ---

  // APPOINTMENTS
  const addAppointment = async (apt: Omit<Appointment, 'id'>) => {
    if (!isUserAdmin) {
      alert('คุณไม่มีสิทธิ์ในการเพิ่มนัดหมาย กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }
    const { error } = await supabase.from('appointments').insert([{
        customer_id: apt.customerId,
        service_id: apt.serviceId,
        date: apt.date,
        time: apt.time,
        status: apt.status,
        doctor_name: apt.doctorName
    }]);
    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
      return;
    }
    refreshData();
  };

  const updateAppointmentStatus = async (id: string, status: Status) => {
    if (!isUserAdmin) {
      alert('คุณไม่มีสิทธิ์ในการแก้ไขนัดหมาย กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
      return;
    }
    refreshData();
  };

  const deleteAppointment = async (id: string) => {
    if (!isUserAdmin) {
      alert('คุณไม่มีสิทธิ์ในการลบนัดหมาย กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
      return;
    }
    refreshData();
  }

  // CUSTOMERS
  const addCustomer = async (customer: Omit<Customer, 'id' | 'history' | 'treatmentHistory' | 'activeCourses'>) => {
    // Allow adding customers from POS even if current user is not admin.
    // Server-side RLS / policies should enforce permissions; frontend will not block.
    // Build insert object, only including fields that have values
    const insertData: any = {
        name: customer.name,
        phone: customer.phone || null,
        email: customer.email || null,
        notes: customer.notes || null,
    };
    
    // Only add optional fields if they exist
    if (customer.birthDate) {
        insertData.birth_date = customer.birthDate;
    }
    if (customer.lineId) {
        insertData.line_id = customer.lineId;
    }
    if (customer.address) {
        insertData.address = customer.address;
    }
    
    const { data, error } = await supabase.from('customers').insert([insertData]).select().single();
    
    if (error) {
      console.error("Add customer error:", error);
      alert('เกิดข้อผิดพลาดในการเพิ่มลูกค้า: ' + error.message);
      return null;
    }
    await refreshData();
    return data; // Return the created customer data (snake_case format usually)
  };

  const updateCustomer = async (id: string, data: Partial<Customer>) => {
    if (!isUserAdmin) {
      alert('คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลลูกค้า กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }
    // Build update object, only including fields that are provided
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.birthDate !== undefined) updateData.birth_date = data.birthDate || null;
    if (data.lineId !== undefined) updateData.line_id = data.lineId || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    
    const { error } = await supabase.from('customers').update(updateData).eq('id', id);
    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
      return;
    }
    refreshData();
  };

  const deleteCustomer = async (id: string) => {
    if (!isUserAdmin) {
      alert('คุณไม่มีสิทธิ์ในการลบลูกค้า กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }
    // Note: This might fail if there are foreign key constraints (history, appointments)
    // In a real app, you'd cascade delete or soft delete.
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
        alert('ไม่สามารถลบลูกค้าได้เนื่องจากมีประวัติการรักษาหรือข้อมูลที่เกี่ยวข้อง (Cannot delete customer with existing records): ' + error.message);
    } else {
        refreshData();
    }
  };

  // SERVICES
  const addService = async (service: Omit<Service, 'id'>) => {
    if (!isUserAdmin) {
      alert('คุณไม่มีสิทธิ์ในการเพิ่มบริการ กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }
    const { error } = await supabase.from('services').insert([{
        name: service.name,
        price: service.price,
        duration_minutes: service.durationMinutes,
        category: service.category,
        consumables: service.consumables,
        image_url: service.imageUrl
    }]).select();
    
    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
      return;
    }
    refreshData();
  };

  const updateService = async (id: string, data: Partial<Service>) => {
    if (!isUserAdmin) {
      alert('คุณไม่มีสิทธิ์ในการแก้ไขบริการ กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }
    const updatePayload: any = {};
    if (data.name) updatePayload.name = data.name;
    if (data.price !== undefined) updatePayload.price = data.price;
    if (data.durationMinutes !== undefined) updatePayload.duration_minutes = data.durationMinutes;
    if (data.category) updatePayload.category = data.category;
    if (data.consumables) updatePayload.consumables = data.consumables;
    if (data.imageUrl !== undefined) updatePayload.image_url = data.imageUrl;

    const { error } = await supabase.from('services').update(updatePayload).eq('id', id);
    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
      return;
    }
    refreshData();
  };

  const deleteService = async (id: string) => {
    if (!isUserAdmin) {
      alert('คุณไม่มีสิทธิ์ในการลบบริการ กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
        return;
    }
    refreshData();
  };

  // INVENTORY
  const updateStock = async (id: string, quantityChange: number) => {
    if (!isUserAdmin) {
      alert('คุณไม่มีสิทธิ์ในการแก้ไขสต็อก กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }
     const item = inventory.find(i => i.id === id);
     if (item) {
         const newQty = Math.max(0, item.quantity + quantityChange);
         const { error } = await supabase.from('inventory').update({ quantity: newQty }).eq('id', id);
         if (error) {
           alert('เกิดข้อผิดพลาด: ' + error.message);
           return;
         }
         refreshData();
     }
  };

  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    if (!isUserAdmin) {
      alert('คุณไม่มีสิทธิ์ในการเพิ่มสินค้า กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }
    const { error } = await supabase.from('inventory').insert([{
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        min_level: item.minLevel,
        price_per_unit: item.pricePerUnit
    }]);
    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
      return;
    }
    refreshData();
  };

  const updateInventoryItem = async (id: string, data: Partial<InventoryItem>) => {
    if (!isUserAdmin) {
      alert('คุณไม่มีสิทธิ์ในการแก้ไขสินค้า กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }
      const updatePayload: any = {};
      if (data.name) updatePayload.name = data.name;
      if (data.quantity !== undefined) updatePayload.quantity = data.quantity;
      if (data.unit) updatePayload.unit = data.unit;
      if (data.minLevel !== undefined) updatePayload.min_level = data.minLevel;
      if (data.pricePerUnit !== undefined) updatePayload.price_per_unit = data.pricePerUnit;

      const { error } = await supabase.from('inventory').update(updatePayload).eq('id', id);
      if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
        return;
      }
      refreshData();
  };

  const deleteInventoryItem = async (id: string) => {
    if (!isUserAdmin) {
      alert('คุณไม่มีสิทธิ์ในการลบสินค้า กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
        return;
      }
      refreshData();
  };

  // COURSES
  const addCourse = async (course: Omit<CourseDefinition, 'id'>) => {
    if (!isUserAdmin) {
      alert('คุณไม่มีสิทธิ์ในการเพิ่มคอร์ส กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }
      const { error } = await supabase.from('courses').insert([{
          name: course.name,
          price: course.price,
          total_units: course.totalUnits,
          description: course.description,
          consumables: course.consumables
      }]);
      if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
        return;
      }
      refreshData();
  };

  const updateCourse = async (id: string, data: Partial<CourseDefinition>) => {
    if (!isUserAdmin) {
      alert('คุณไม่มีสิทธิ์ในการแก้ไขคอร์ส กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }
      const updatePayload: any = {};
      if (data.name) updatePayload.name = data.name;
      if (data.price !== undefined) updatePayload.price = data.price;
      if (data.totalUnits !== undefined) updatePayload.total_units = data.totalUnits;
      if (data.description) updatePayload.description = data.description;
      if (data.consumables) updatePayload.consumables = data.consumables;

      const { error } = await supabase.from('courses').update(updatePayload).eq('id', id);
      if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
        return;
      }
      refreshData();
  };

  const deleteCourse = async (id: string) => {
    if (!isUserAdmin) {
      alert('คุณไม่มีสิทธิ์ในการลบคอร์ส กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
        return;
      }
      refreshData();
  };


  // TRANSACTIONS & COURSE USAGE
  const processSale = async (customerId: string, items: { type: 'service' | 'course'; id: string; price: number; quantity: number }[], paymentMethod: Transaction['paymentMethod']) => {
    // Allow processing sales from POS for non-admin users. Server rules still apply.
    if (!customerId || !items || items.length === 0) {
      alert('รายการไม่ถูกต้อง: โปรดตรวจสอบลูกค้าและสินค้าที่จะชำระ');
      return;
    }
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const { data: transData, error: transError } = await supabase.from('transactions').insert([{
          customer_id: customerId,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          items: items
      }]).select();

      if (transError || !transData) {
          console.error("Sale failed", transError);
          alert('เกิดข้อผิดพลาดในการทำรายการ: ' + (transError?.message || 'Unknown error'));
          return;
      }

      const courseInserts: any[] = [];
      items.forEach(item => {
          if (item.type === 'course') {
              const def = courseDefinitions.find(c => c.id === item.id);
              if (def) {
                  for(let i=0; i<item.quantity; i++) {
                      courseInserts.push({
                          customer_id: customerId,
                          course_id: def.id,
                          course_name: def.name,
                          total_units: def.totalUnits,
                          remaining_units: def.totalUnits,
                          active: true
                      });
                  }
              }
          }
      });

      if (courseInserts.length > 0) {
          await supabase.from('customer_courses').insert(courseInserts);
      }

      refreshData();
  };

  const updateTransaction = async (transactionId: string, items: { name: string; price: number; quantity: number }[]) => {
    // Allow updating transactions from UI if authorized by backend; frontend does not block by admin flag.
    if (!transactionId) {
      alert('ไม่พบรายการที่จะแก้ไข');
      return false;
    }
    try {
      const totalAmount = items.reduce((s, it) => s + (it.price * it.quantity), 0);
      const { error } = await supabase.from('transactions').update({ items, total_amount: totalAmount }).eq('id', transactionId);
      if (error) {
        console.error('Failed to update transaction:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกการแก้ไข: ' + error.message);
        return false;
      }
      await refreshData();
      return true;
    } catch (e: any) {
      console.error('Exception updating transaction:', e);
      alert('เกิดข้อผิดพลาดในการบันทึกการแก้ไข: ' + (e?.message || e));
      return false;
    }
  };

  const addTreatmentRecord = async (customerId: string, record: { treatmentName: string; details: string; doctorName: string; doctorFee?: number; unitsUsed?: number; photos?: File[] }) => {
    if (!customerId) {
      alert('ไม่พบลูกค้า');
      return false;
    }

    try {
      const uploadedUrls: string[] = [];

      if (record.photos && record.photos.length > 0) {
        // Upload each file to storage (bucket: treatment-photos)
        for (let i = 0; i < record.photos.length; i++) {
          const file = record.photos[i];
          try {
            const path = `customers/${customerId}/${Date.now()}_${i}_${file.name}`;
            const { error: upErr } = await supabase.storage.from('treatment-photos').upload(path, file as any, { upsert: false });
            if (upErr) {
              console.warn('Failed to upload photo:', upErr.message);
              continue;
            }
            const { data: publicData } = supabase.storage.from('treatment-photos').getPublicUrl(path);
            if (publicData?.publicUrl) uploadedUrls.push(publicData.publicUrl);
          } catch (e: any) {
            console.warn('Photo upload exception', e?.message || e);
          }
        }
      }

      // Try to insert photos field if DB supports it; fall back if column missing
      const insertPayload: any = {
        customer_id: customerId,
        treatment_name: record.treatmentName,
        details: record.details,
        doctor_name: record.doctorName,
        units_used: record.unitsUsed || 0,
        doctor_fee: record.doctorFee || 0
      };
      if (uploadedUrls.length > 0) insertPayload.photos = uploadedUrls;

      const { error } = await supabase.from('treatment_records').insert([insertPayload]);
      if (error) {
        // If photos column doesn't exist, insert without photos
        if (error.message && error.message.includes('column "photos"')) {
          const partial = { ...insertPayload };
          delete partial.photos;
          const { error: fallbackErr } = await supabase.from('treatment_records').insert([partial]);
          if (fallbackErr) {
            console.error('Failed to insert treatment record:', fallbackErr);
            alert('ไม่สามารถบันทึกประวัติการรักษาได้: ' + fallbackErr.message);
            return false;
          }
          // Photos uploaded but not linked in DB
          console.warn('Photos uploaded but DB does not have photos column. Run DB migration to persist photo URLs.');
          await refreshData();
          return true;
        }
        console.error('Failed to insert treatment record:', error);
        alert('ไม่สามารถบันทึกประวัติการรักษาได้: ' + error.message);
        return false;
      }

      await refreshData();
      return true;
    } catch (e: any) {
      console.error('Exception addTreatmentRecord:', e);
      alert('เกิดข้อผิดพลาดในการบันทึกประวัติ: ' + (e?.message || e));
      return false;
    }
  };


  const useCourse = async (customerId: string, courseInstanceId: string, unitsToUse: number, treatmentDetails: Omit<TreatmentRecord, 'id' | 'date' | 'unitsUsed'>) => {
    if (!isUserAdmin) {
      alert('คุณไม่มีสิทธิ์ในการใช้คอร์ส กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }
      const customer = customers.find(c => c.id === customerId);
      const courseInstance = customer?.activeCourses.find(c => c.id === courseInstanceId);
      if (!customer || !courseInstance) {
        alert('ไม่พบข้อมูลลูกค้าหรือคอร์ส');
        return;
      }

      const newRemaining = Math.max(0, courseInstance.remainingUnits - unitsToUse);
      await supabase.from('customer_courses').update({
          remaining_units: newRemaining,
          active: newRemaining > 0
      }).eq('id', courseInstanceId);

      await supabase.from('treatment_records').insert([{
          customer_id: customerId,
          treatment_name: treatmentDetails.treatmentName,
          details: treatmentDetails.details,
          doctor_name: treatmentDetails.doctorName,
          units_used: unitsToUse,
          doctor_fee: treatmentDetails.doctorFee || 0
      }]);

      const courseDef = courseDefinitions.find(c => c.id === courseInstance.courseId);
      if (courseDef && courseDef.consumables) {
          for (const con of courseDef.consumables) {
              const invItem = inventory.find(i => i.id === con.inventoryItemId);
              if (invItem) {
                  const deductAmount = con.quantityUsed * unitsToUse;
                  const newQty = Math.max(0, invItem.quantity - deductAmount);
                  await supabase.from('inventory').update({ quantity: newQty }).eq('id', con.inventoryItemId);
              }
          }
      }

      refreshData();
  };

  return (
    <ClinicContext.Provider value={{ 
      customers, services, appointments, inventory, courseDefinitions, transactions, isLoadingData, dbConnectionError,
      addAppointment, updateAppointmentStatus, deleteAppointment,
      addCustomer, updateCustomer, deleteCustomer,
      addService, updateService, deleteService,
      updateStock, addInventoryItem, updateInventoryItem, deleteInventoryItem,
      addCourse, updateCourse, deleteCourse,
      processSale, useCourse, addTreatmentRecord, updateTransaction, refreshData, skipLoadingAndContinue, seedDatabase, exportToSQL, resetDatabase
    }}>
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};