import {LocalizedStringsMethods} from 'react-localization';

export interface IString extends LocalizedStringsMethods {
  global: {
    firo: string;
    balance: string;
  };

  component_button: {
    copy: string;
    max: string;
    get_firo: string;
    cancel: string;
    ok: string;
  };

  component_input: {
    mnemonic_input_hint: string;
    passphrase_input_hint: string;
  };

  create_address_card: {
    current_address: string;
    address_name: string;
    save_address: string;
  };

  empty_state: {
    no_transaction: string;
    short_description: string;
  };

  send_address: {
    address: string;
  };

  amount_input: {
    enter_amount: string;
    amount: string;
  };

  transaction_list_item: {
    received: string;
    sent: string;
  };

  welcome_screen: {
    title: string;
    body_part_1: string;
    body_part_2: string;
    body_part_3: string;
    create_wallet: string;
    creating: string;
    restore_wallet: string;
  };

  mnemonic_view_screen: {
    title: string;
    body_part_1: string;
    body_part_2: string;
    copy: string;
    continue: string;
  };

  mnemonic_input_screen: {
    title: string;
    body_part_1: string;
    body_part_2: string;
    continue: string;
    restoring: string;
  };

  passphrase_screen: {
    title: string;
    body: string;
    create: string;
    creating: string;
  };

  enter_passphrase_screen: {
    title: string;
    body: string;
    login: string;
    loading: string;
  };

  transaction_details: {
    title: string;
    transaction_id: string;
    sent: string;
    received: string;
    sent_to: string;
    received_from: string;
    label: string;
    fee: string;
  };

  send_screen: {
    title: string;
    label_optional: string;
    transaction_fee: string;
    total_send_amount: string;
    send: string;
    reduce_fee: string;
  };

  receive_screen: {
    title: string;
    scan_qr: string;
    select_from_saved_address: string;
  };

  my_wallet_screen: {
    title: string;
  };

  address_details_screen: {
    title: string;
    address: string;
    name: string;
  };

  address_book_screen: {
    title: string;
    add_new: string;
  };

  add_edit_address_screen: {
    edit_address: string;
    add_new_address: string;
    address: string;
    name: string;
    save: string;
  };

  scan_qrcode_screen: {
    invalid_qrcode_fragment: string;
    camera_use_permission_title: string;
    camera_use_permission_message: string;
    open_settings: string;
  };

  settings: {
    title: string;
    title_currency: string;
    description_currency: string;
    title_notification: string;
    description_notification: string;
    title_passphrase: string;
    description_passphrase: string;
    title_mnemonic: string;
    description_mnemonic: string;
    title_restore: string;
    description_restore: string;
    title_fingerprint: string;
    description_fingerprint: string;
    button_done: string;
  };

  currencies: {
    usd: string;
    eur: string;
    gbp: string;
    aud: string;
    btc: string;
  };

  errors: {
    error: string;
  };
}
