import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

// Toast configuration
const TOAST_LIMIT = 5; // Maximum number of toasts to show at once
const TOAST_REMOVE_DELAY = 1000; // Delay before removing toast from DOM after dismiss (1 second)
const DEFAULT_DURATION = 5000; // Default auto-dismiss duration (5 seconds)
const SUCCESS_DURATION = 3000; // Success toasts dismiss faster (3 seconds)
const ERROR_DURATION = 7000; // Error toasts stay longer (7 seconds)
const INFO_DURATION = 5000; // Info toasts default duration (5 seconds)

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  duration?: number; // Auto-dismiss duration in milliseconds
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const toastDismissTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Adds a toast to the remove queue (removes from DOM after dismiss animation)
 */
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

/**
 * Sets up auto-dismiss timer for a toast
 */
const setupAutoDismiss = (toastId: string, duration: number) => {
  // Clear any existing dismiss timeout
  if (toastDismissTimeouts.has(toastId)) {
    clearTimeout(toastDismissTimeouts.get(toastId)!);
  }

  // Set up new dismiss timeout
  const timeout = setTimeout(() => {
    toastDismissTimeouts.delete(toastId);
    dispatch({
      type: "DISMISS_TOAST",
      toastId: toastId,
    });
  }, duration);

  toastDismissTimeouts.set(toastId, timeout);
};

/**
 * Clears auto-dismiss timer for a toast
 */
const clearAutoDismiss = (toastId: string) => {
  if (toastDismissTimeouts.has(toastId)) {
    clearTimeout(toastDismissTimeouts.get(toastId)!);
    toastDismissTimeouts.delete(toastId);
  }
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST": {
      const newToasts = [action.toast, ...state.toasts].slice(0, TOAST_LIMIT);
      
      // Set up auto-dismiss timer if duration is specified
      if (action.toast.duration !== undefined && action.toast.duration > 0) {
        setupAutoDismiss(action.toast.id, action.toast.duration);
      }
      
      return {
        ...state,
        toasts: newToasts,
      };
    }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // Clear auto-dismiss timer when manually dismissed
      if (toastId) {
        clearAutoDismiss(toastId);
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          clearAutoDismiss(toast.id);
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id">;

/**
 * Gets the default duration for a toast variant
 */
const getDefaultDuration = (variant?: string): number => {
  switch (variant) {
    case "success":
      return SUCCESS_DURATION;
    case "destructive":
      return ERROR_DURATION;
    case "info":
      return INFO_DURATION;
    default:
      return DEFAULT_DURATION;
  }
};

function toast({ duration, variant, ...props }: Toast) {
  const id = genId();

  // Use provided duration or default based on variant
  const toastDuration = duration !== undefined 
    ? duration 
    : getDefaultDuration(variant);

  const update = (props: ToasterToast) => {
    // Clear old auto-dismiss if updating
    clearAutoDismiss(id);
    
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
    
    // Set up new auto-dismiss if duration is specified
    if (props.duration !== undefined && props.duration > 0) {
      setupAutoDismiss(id, props.duration);
    }
  };
  
  const dismiss = () => {
    clearAutoDismiss(id);
    dispatch({ type: "DISMISS_TOAST", toastId: id });
  };

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      variant,
      id,
      duration: toastDuration,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
