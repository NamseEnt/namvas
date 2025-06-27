import { Button } from "@/components/ui/button";
import { useStudioContext } from "./index";

export function OrderBlock() {
  const { state, handleOrder } = useStudioContext();

  return (
    <div className="border-t border-border bg-card p-6">
      <Button
        onClick={handleOrder}
        disabled={!state.uploadedImage}
        className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        size="lg"
      >
        주문하기
      </Button>
    </div>
  );
}