import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check } from "lucide-react";
import { toast } from "sonner";
import { partyService } from "@/services/party.service";
import type { PartyRecord } from "@/types/api.types";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";



interface PartyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingParty?: PartyRecord | null;
  onSuccess?: (party: PartyRecord) => void;
}

export function PartyFormModal({ isOpen, onClose, editingParty, onSuccess }: PartyFormModalProps) {
  // Form States
  const [name, setName] = useState("");
  const [partyType, setPartyType] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [mobile, setMobile] = useState("");
  const [whatsAppMobile, setWhatsAppMobile] = useState("");
  const [email, setEmail] = useState("");
  const [pan, setPan] = useState("");
  const [gst, setGst] = useState("");
  const [address, setAddress] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [status, setStatus] = useState("");
  const [remark, setRemark] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sync state with editingParty
  useEffect(() => {
    if (editingParty) {
      setName(editingParty.partyName);
      setPartyType(editingParty.partyType || "");
      setContactPerson(editingParty.contactPerson);
      setMobile(editingParty.primaryMobile);
      setWhatsAppMobile(editingParty.whatsAppMobile || "");
      setEmail(editingParty.email);
      setPan(editingParty.panNumber || "");
      setGst(editingParty.gstin || "");
      setAddress(editingParty.address);
      setCityInput(editingParty.city);
      setState(editingParty.state);
      setPincode(editingParty.pincode ? String(editingParty.pincode) : "");
      setStatus(editingParty.status || (editingParty.isActive ? "Active" : "Inactive"));
      setRemark(editingParty.remark || "");
    } else {
      setName("");
      setPartyType("");
      setContactPerson("");
      setMobile("");
      setWhatsAppMobile("");
      setEmail("");
      setPan("");
      setGst("");
      setAddress("");
      setCityInput("");
      setState("");
      setPincode("");
      setStatus("");
      setRemark("");
    }
    setError("");
  }, [editingParty, isOpen]);



  const nameError = (error.toLowerCase().includes("party name") || error.toLowerCase().includes("partyname") || (error.toLowerCase().includes("name") && !error.toLowerCase().includes("contact") && !error.toLowerCase().includes("person"))) ? error : "";
  const contactError = (error.toLowerCase().includes("contact") || error.toLowerCase().includes("person")) ? error : "";
  const mobileError = (error.toLowerCase().includes("mobile") && !error.toLowerCase().includes("whatsapp")) ? error : "";
  const whatsappError = error.toLowerCase().includes("whatsapp") ? error : "";
  const addressError = error.toLowerCase().includes("address") ? error : "";
  const cityError = error.toLowerCase().includes("city") ? error : "";
  const stateError = error.toLowerCase().includes("state") ? error : "";
  const pincodeError = (error.toLowerCase().includes("pincode") || error.toLowerCase().includes("pin")) ? error : "";
  const panError = error.toLowerCase().includes("pan") ? error : "";
  const gstError = (error.toLowerCase().includes("gstin") || error.toLowerCase().includes("gst")) ? error : "";
  const generalError = error && !nameError && !contactError && !mobileError && !whatsappError && !addressError && !cityError && !stateError && !pincodeError && !panError && !gstError ? error : "";

  if (!isOpen) return null;



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedContact = contactPerson.trim();
    const trimmedMobile = mobile.trim();
    const trimmedWhatsApp = whatsAppMobile.trim();
    const trimmedEmail = email.trim();
    const trimmedPan = pan.trim().toUpperCase();
    const trimmedGst = gst.trim().toUpperCase();
    const trimmedAddress = address.trim();
    const trimmedCity = cityInput.trim();
    const trimmedState = state.trim();
    const trimmedPincode = pincode.trim();
    const trimmedRemark = remark.trim();

    // Validations
    if (!trimmedName) return setError("Party Name is required");
    if (!partyType) return setError("Party Type is required");
    if (!trimmedContact) return setError("Contact Person is required");
    if (!/^[6-9]\d{9}$/.test(trimmedMobile)) return setError("Valid 10-digit primary mobile number is required");
    if (trimmedWhatsApp && !/^[6-9]\d{9}$/.test(trimmedWhatsApp)) return setError("WhatsApp number must be 10 digits");
    if (!trimmedAddress) return setError("Address is required");
    if (!trimmedCity) return setError("City is required");
    if (!trimmedState) return setError("State is required");
    if (!status) return setError("Status is required");
    if (trimmedPincode && !/^\d{6}$/.test(trimmedPincode)) return setError("Pincode must be a valid 6-digit number");
    if (trimmedPan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(trimmedPan)) return setError("Valid PAN number is required");
    // Only validate GSTIN if it's not empty (allowing alphanumeric characters for the 14th slot taxpayer type code)
    if (trimmedGst && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{3}$/i.test(trimmedGst)) {
      return setError("Valid 15-digit GSTIN is required (e.g. 27AAAAA1111A1Z1)");
    }

    setSubmitting(true);
    try {
      const pinNum = trimmedPincode ? parseInt(trimmedPincode, 10) : 0;
      if (editingParty) {
        const payload = {
          partyId: editingParty.partyId,
          partyName: trimmedName,
          partyType,
          contactPerson: trimmedContact,
          primaryMobile: trimmedMobile,
          whatsAppMobile: trimmedWhatsApp || trimmedMobile,
          email: trimmedEmail,
          address: trimmedAddress,
          gstin: trimmedGst,
          panNumber: trimmedPan,
          city: trimmedCity,
          state: trimmedState,
          pincode: pinNum,
          status,
          remark: trimmedRemark,
          isActive: status === "Active",
          updatedBy: 1, // Default user ID for now
        };

        const response = await partyService.updateParty(payload);
        if (response.data.responseStatus === "Success") {
          toast.success("Party updated successfully");
          // Create updated party object
          const updatedParty: PartyRecord = {
            ...editingParty,
            ...payload
          };
          if (onSuccess) onSuccess(updatedParty);
          onClose();
        } else {
          toast.error(response.data.message || "Failed to update party");
        }
      } else {
        const payload = {
          partyName: trimmedName,
          partyType,
          contactPerson: trimmedContact,
          primaryMobile: trimmedMobile,
          whatsAppMobile: trimmedWhatsApp || trimmedMobile,
          email: trimmedEmail,
          address: trimmedAddress,
          gstin: trimmedGst,
          panNumber: trimmedPan,
          city: trimmedCity,
          state: trimmedState,
          pincode: pinNum,
          status,
          remark: trimmedRemark,
          isActive: status === "Active",
          createdBy: 1, // Default user ID for now
        };

        const response = await partyService.addParty(payload);
        if (response.data.responseStatus === "Success") {
          toast.success("Party added successfully");
          // Create new party object (use dummy ID for now, since API might not return it immediately)
          const newParty: PartyRecord = {
            partyId: Date.now(), // Temporary ID
            ...payload,
            createdAt: new Date().toISOString(),
            updateAt: new Date().toISOString(),
            updatedBy: 1,
          };
          if (onSuccess) onSuccess(newParty);
          onClose();
        } else {
          toast.error(response.data.message || "Failed to add party");
        }
      }
    } catch (err: any) {
      console.error("Error submitting party:", err);
      toast.error(err.response?.data?.message || "Operation failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[99999] animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            {editingParty ? "Edit Party details" : "Add New Party"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center"
            aria-label="Close"
            disabled={submitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {generalError && (
            <div className="flex items-center gap-1.5 p-2.5 rounded bg-red-50 dark:bg-red-900/20 text-red-650 dark:text-red-400 font-medium">
              <span className="font-bold">Error:</span>
              <span>{generalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Party Name */}
            <div className="sm:col-span-2">
              <Input
                label="Party Name *"
                type="text"
                placeholder="e.g. BuildMart Steel Retailers"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                error={nameError}
                maxLength={200}
                disabled={submitting}
              />
            </div>

            {/* Party Type */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-[10px] font-bold text-black uppercase ml-1 tracking-wider block">Party Type *</label>
              <SearchableSelect
                value={partyType}
                onChange={(val) => setPartyType(val)}
                options={[
                  { value: "Wholesaler", label: "Wholesaler" },
                  { value: "Retailer", label: "Retailer" },
                  { value: "Direct Customer", label: "Direct Customer" },
                ]}
                placeholder="Select Party Type"
                className="w-full text-xs font-semibold"
                disabled={submitting}
              />
            </div>

            {/* Contact Person */}
            <Input
              label="Contact Person *"
              type="text"
              placeholder="Primary contact name"
              value={contactPerson}
              onChange={(e) => { setContactPerson(e.target.value); setError(""); }}
              error={contactError}
              disabled={submitting}
            />

            {/* Mobile */}
            <Input
              label="Primary Mobile *"
              type="text"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => { setMobile(e.target.value); setError(""); }}
              error={mobileError}
              maxLength={10}
              className="font-mono"
              disabled={submitting}
            />

            {/* WhatsApp Mobile */}
            <Input
              label="WhatsApp Mobile"
              type="text"
              placeholder="e.g. 9876543210"
              value={whatsAppMobile}
              onChange={(e) => { setWhatsAppMobile(e.target.value); setError(""); }}
              error={whatsappError}
              maxLength={10}
              className="font-mono"
              disabled={submitting}
            />

            {/* Email Address */}
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. buyer@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />

            {/* PAN Number */}
            <Input
              label="PAN Number"
              type="text"
              placeholder="e.g. ABCDE1234F"
              value={pan}
              onChange={(e) => { setPan(e.target.value); setError(""); }}
              error={panError}
              maxLength={10}
              className="uppercase font-mono"
              disabled={submitting}
            />

            {/* GSTIN */}
            <Input
              label="GSTIN"
              type="text"
              placeholder="e.g. 27AAAAA1111A1Z1"
              value={gst}
              onChange={(e) => { setGst(e.target.value); setError(""); }}
              error={gstError}
              maxLength={15}
              className="uppercase font-mono"
              disabled={submitting}
            />

            {/* Address */}
            <div className="sm:col-span-2">
              <Input
                label="Address *"
                type="text"
                placeholder="Street name, industrial area details..."
                value={address}
                onChange={(e) => { setAddress(e.target.value); setError(""); }}
                error={addressError}
                disabled={submitting}
              />
            </div>

            {/* Status Dropdown */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-[10px] font-bold text-black uppercase ml-1 tracking-wider block">Status *</label>
              <SearchableSelect
                value={status}
                onChange={(val) => setStatus(val)}
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                ]}
                placeholder="Select Status"
                className="w-full text-xs font-semibold"
                disabled={submitting}
              />
            </div>



            {/* City */}
            <div className="sm:col-span-1">
              <Input
                label="City *"
                type="text"
                placeholder="e.g. Mumbai"
                value={cityInput}
                onChange={(e) => { setCityInput(e.target.value); setError(""); }}
                error={cityError}
                disabled={submitting}
              />
            </div>

            {/* State */}
            <div className="sm:col-span-1">
              <Input
                label="State *"
                type="text"
                placeholder="e.g. Tamil Nadu"
                value={state}
                onChange={(e) => { setState(e.target.value); setError(""); }}
                error={stateError}
                disabled={submitting}
              />
            </div>

            {/* Pincode */}
            <div className="sm:col-span-1">
              <Input
                label="Pincode"
                type="text"
                placeholder="6-digit PIN"
                value={pincode}
                onChange={(e) => { setPincode(e.target.value); setError(""); }}
                error={pincodeError}
                maxLength={6}
                className="font-mono"
                disabled={submitting}
              />
            </div>

            {/* Remark / Notes */}
            <div className="sm:col-span-3">
              <Textarea
                label="Remarks / Notes"
                placeholder="confidential remarks, credit comments..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="min-h-[50px] py-2"
                rows={2}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} loading={submitting}>
              {!submitting && <Check className="h-4 w-4 mr-1.5" />}
              <span>{editingParty ? "Save Changes" : "Register Party"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}