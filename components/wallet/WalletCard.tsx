import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Plus,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export interface WalletTransaction {
  _id: string;
  amount: number;
  displayName: string;
  method: string;
  isPositive: boolean;
  createdAt: string;
}

interface WalletCardProps {
  compact?: boolean;
}

const topupAmounts = [100000, 200000, 500000, 1000000, 2000000, 5000000];

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("vi-VN");

const formatCurrency = (amount: number) =>
  `${new Intl.NumberFormat("vi-VN").format(Math.abs(amount))}đ`;

const TransactionRow = ({
  transaction,
}: {
  transaction: WalletTransaction;
}) => {
  const isPositive = transaction.isPositive;

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isPositive ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {isPositive ? (
            <ArrowDownLeft className="text-green-600 w-5 h-5" />
          ) : (
            <ArrowUpRight className="text-red-600 w-5 h-5" />
          )}
        </div>

        <div>
          <p className="text-sm font-semibold">{transaction.displayName}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(transaction.createdAt)}
          </p>
        </div>
      </div>

      <p
        className={`text-sm font-semibold ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        {isPositive ? "+" : "-"}
        {formatCurrency(transaction.amount)}
      </p>
    </div>
  );
};

const TopupDialog = ({
  open,
  onClose,
  selectedAmount,
  onSelectAmount,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  selectedAmount: number | null;
  onSelectAmount: (amount: number) => void;
  onConfirm: () => void;
}) => (
  <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Nạp tiền vào ví</DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3 mt-2">
        {topupAmounts.map((amount) => (
          <button
            key={amount}
            onClick={() => onSelectAmount(amount)}
            className={`p-3 rounded-xl border text-center font-medium transition-all ${
              selectedAmount === amount
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/50 text-foreground"
            }`}
          >
            {formatCurrency(amount)}
          </button>
        ))}
      </div>

      <Button
        variant="hero"
        className="w-full mt-4"
        disabled={!selectedAmount}
        onClick={onConfirm}
      >
        {selectedAmount
          ? `Nạp ${formatCurrency(selectedAmount)}`
          : "Chọn số tiền"}
      </Button>
    </DialogContent>
  </Dialog>
);

const HistoryDialog = ({
  open,
  onClose,
  transactions,
}: {
  open: boolean;
  onClose: () => void;
  transactions: WalletTransaction[];
}) => (
  <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
    <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Lịch sử giao dịch</DialogTitle>
      </DialogHeader>

      <div className="space-y-3 mt-2">
        {transactions.map((tx) => (
          <TransactionRow key={tx._id} transaction={tx} />
        ))}
      </div>
    </DialogContent>
  </Dialog>
);

const WalletCard = ({ compact = false }: WalletCardProps) => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [showTopup, setShowTopup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const fetchWallet = async () => {
      const res = await fetch("/api/wallet", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        return;
      }

      const data = await res.json();

      if (mounted) {
        setBalance(data.balance || 0);
      }
    };

    const fetchTransactions = async () => {
      const res = await fetch("/api/wallet/transactions", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        return;
      }

      const data = await res.json();

      if (mounted) {
        setTransactions(Array.isArray(data) ? data : []);
      }
    };

    const refreshWalletData = () => {
      void fetchWallet();
      void fetchTransactions();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshWalletData();
      }
    };

    refreshWalletData();
    window.addEventListener("otto-wallet-updated", refreshWalletData);
    window.addEventListener("focus", refreshWalletData);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      window.removeEventListener("otto-wallet-updated", refreshWalletData);
      window.removeEventListener("focus", refreshWalletData);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleTopup = () => {
    if (!selectedAmount) {
      return;
    }

    toast({
      title: "Nạp tiền thành công!",
      description: `Đã nạp ${formatCurrency(selectedAmount)} vào ví Otto`,
    });
    setShowTopup(false);
    setSelectedAmount(null);
  };

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wallet size={18} />
              <span className="text-sm font-medium opacity-90">Ví Otto</span>
            </div>
            <button
              onClick={() => router.push("/deposit")}
              className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Plus size={16} />
            </button>
          </div>

          <p className="text-2xl font-bold">{formatCurrency(balance)}</p>
          <button
            onClick={() => setShowHistory(true)}
            className="text-xs opacity-80 underline mt-1"
          >
            Xem lịch sử
          </button>

          <TopupDialog
            open={showTopup}
            onClose={() => {
              setShowTopup(false);
              setSelectedAmount(null);
            }}
            selectedAmount={selectedAmount}
            onSelectAmount={setSelectedAmount}
            onConfirm={handleTopup}
          />

          <HistoryDialog
            open={showHistory}
            onClose={() => setShowHistory(false)}
            transactions={transactions}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-sm opacity-80">Số dư ví Otto</p>
              <p className="text-2xl font-bold">{formatCurrency(balance)}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
            onClick={() => router.push("/deposit")}
          >
            <Plus size={16} className="mr-1" />
            Nạp tiền
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
            onClick={() => setShowHistory(true)}
          >
            <History size={16} className="mr-1" />
            Lịch sử
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        <p className="text-sm font-medium text-muted-foreground mb-3">
          Giao dịch gần đây
        </p>
        <div className="space-y-3">
          {transactions.slice(0, 3).map((tx) => (
            <TransactionRow key={tx._id} transaction={tx} />
          ))}
        </div>
      </CardContent>

      <TopupDialog
        open={showTopup}
        onClose={() => {
          setShowTopup(false);
          setSelectedAmount(null);
        }}
        selectedAmount={selectedAmount}
        onSelectAmount={setSelectedAmount}
        onConfirm={handleTopup}
      />

      <HistoryDialog
        open={showHistory}
        onClose={() => setShowHistory(false)}
        transactions={transactions}
      />
    </Card>
  );
};

export default WalletCard;
