// Import Packages
"use client"
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Import Libraries
import axios from 'axios';

// Import Icons
import { BsPersonCheck } from 'react-icons/bs';
import { TbShoppingBagCheck } from 'react-icons/tb';
import { HiOutlineBanknotes } from 'react-icons/hi2';

// Import Components
import { MobileSize } from '@/components';

// Import Templates
import { Sidebar, Home } from '@/templates';

// Import Contexts
import { useSidebar } from '@/context/sidebarContext';
import { useAuth } from '@/context/authContext';

// Import Functions
import useHandleResize from '@/utils/handleResize';
import rupiachCurrencyFormat from '@/utils/rupiahCurrencyFormat';

// Interfaces
interface TotalTransactions {
 total_order_paid: number;
 total_order: number;
}

interface usersDistribution {
 user_basic_percentage: number;
 user_silver_percentage: number;
 user_gold_percentage: number;
}

interface weeklyTransaction {
 order_day: string;
 total_transaction: number;
}

const HomePage = () => {
 // Router
 const router = useRouter();
 useEffect(() => {
  if (!localStorage.getItem("token")) {
  router.push("/");
}
  }, [router])

 // Util
 const isDesktop = useHandleResize();

 // Context
 const { open } = useSidebar();
 const { token } = useAuth();

 // State
 const [totalTransactions, setTotalTransactions] = useState<TotalTransactions>({ total_order_paid: 0, total_order: 0 });
 const [transactionMembers, setTransactionMembers] = useState<number>(0);
 const [transactionMemberIncomes, setTransactionMemberIncomes] = useState<number>(0);
 const [usersDistribution, setUsersDistribution] = useState<usersDistribution>({
  user_basic_percentage: 0,
  user_silver_percentage: 0,
  user_gold_percentage: 0,
 });
 const [weeklyTransaction, setWeeklyTransaction] = useState<weeklyTransaction[]>([]);

 // Axios


 // Variable
 const cardData = [
  {
   title: 'Transactions',
   icon: <TbShoppingBagCheck />,
   selectedData: String(totalTransactions?.total_order_paid),
   totalData: String(totalTransactions?.total_order),
  },
  {
   title: 'Transaction Members',
   icon: <BsPersonCheck />,
   selectedData: String(0),
   totalData: String(transactionMembers),
  },
  {
   title: 'Incomes',
   icon: <HiOutlineBanknotes />,
   selectedData: String(0),
   totalData: String(rupiachCurrencyFormat(transactionMemberIncomes)),
  },
 ];
console.log(token)

 return (
  <>
   {isDesktop ? (
    <div className="flex fixed">
     <Sidebar page="/home" />
     <Home open={open} transactions={weeklyTransaction} distributions={usersDistribution} cards={cardData} />
    </div>
   ) : (
    <MobileSize />
   )}
  </>
 );
};

export default HomePage;
